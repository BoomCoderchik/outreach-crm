import { expect, test, type Page } from '@playwright/test';

async function createAccount(page: Page) {
  const email = `smoke-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  await page.getByRole('button', { name: /New here\?/ }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('local-password-123');
  await page.getByLabel('Confirm password').fill('local-password-123');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your outreach, at a glance.' })).toBeVisible();
  return email;
}

test('creates a private account and renders the empty outreach workspace', async ({ page }) => {
  await page.goto('/');
  await createAccount(page);

  await expect(page.getByTestId('dashboard')).toBeVisible();
  await expect(page.getByText('No projects connected')).toBeVisible();
  await expect(page.getByText('No activity recorded yet')).toBeVisible();
  await expect(page.getByText('Local & private')).toBeVisible();
});

test('connects a project, searches it, and keeps it after a reload', async ({ page }) => {
  await page.goto('/');
  await createAccount(page);

  await page.getByRole('button', { name: 'Connect project', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Connect a project' })).toBeVisible();
  await page.getByLabel('Project name').fill('Founder outreach');
  await page.getByLabel('Folder path').fill('C:\\Work\\Founder outreach');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  await expect(page.getByText('Founder outreach', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Projects', exact: true }).first().click();
  await page.getByLabel('Search projects').fill('Founder');
  await expect(page.getByText('C:\\Work\\Founder outreach')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Founder outreach', { exact: true })).toBeVisible();
});

test('supports sign out and sign in with the same local account', async ({ page }) => {
  await page.goto('/');
  const email = await createAccount(page);

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to your CRM.' })).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('local-password-123');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByTestId('dashboard')).toBeVisible();
});

test('keeps projects isolated between local accounts', async ({ page }) => {
  await page.goto('/');
  await createAccount(page);
  await page.getByRole('button', { name: 'Connect project', exact: true }).click();
  await page.getByLabel('Project name').fill('Private project');
  await page.getByLabel('Folder path').fill('C:\\Private');
  await page.getByRole('button', { name: 'Save project', exact: true }).click();
  await expect(page.getByText('Private project', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.getByRole('button', { name: /New here\?/ }).click();
  await page.getByLabel('Email').fill(`other-${Date.now()}@example.com`);
  await page.getByLabel('Password', { exact: true }).fill('other-password-123');
  await page.getByLabel('Confirm password').fill('other-password-123');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByText('No projects connected')).toBeVisible();
  await expect(page.getByText('Private project', { exact: true })).toHaveCount(0);
});

test.describe('mobile navigation', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  test('opens the navigation drawer and reaches Projects', async ({ page }) => {
    await page.goto('/');
    await createAccount(page);

    await page.getByRole('button', { name: 'Open navigation' }).click();
    const drawer = page.getByRole('dialog', { name: 'Workspace navigation' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Projects', exact: true })).toBeVisible();

    await drawer.getByRole('button', { name: 'Projects', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
    await expect(drawer).toBeHidden();
  });

  test('keeps keyboard focus inside the drawer and restores it on close', async ({ page }) => {
    await page.goto('/');
    await createAccount(page);

    const trigger = page.getByRole('button', { name: 'Open navigation' });
    await trigger.focus();
    await trigger.press('Enter');

    const drawer = page.getByRole('dialog', { name: 'Workspace navigation' });
    const closeButton = drawer.getByRole('button', { name: 'Close navigation drawer' });
    const overviewButton = drawer.getByRole('button', { name: 'Overview', exact: true });
    const projectsButton = drawer.getByRole('button', { name: 'Projects', exact: true });

    await expect(drawer).toBeVisible();
    await expect(closeButton).toBeFocused();
    await expect(page.locator('#workspace-shell')).toHaveAttribute('inert');

    await page.keyboard.press('Tab');
    await expect(overviewButton).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(projectsButton).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(overviewButton).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(closeButton).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
