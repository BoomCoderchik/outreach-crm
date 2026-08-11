import { expect, test } from '@playwright/test';

test('renders the empty outreach workspace foundation', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Your outreach, at a glance.' })).toBeVisible();
  await expect(page.getByTestId('dashboard')).toBeVisible();
  await expect(page.getByText('No projects connected')).toBeVisible();
  await expect(page.getByText('No activity recorded yet')).toBeVisible();
});

test.describe('mobile navigation', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

  test('opens the navigation drawer and reaches Projects', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Open navigation' }).click();
    const drawer = page.getByRole('dialog', { name: 'Workspace navigation' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Projects', exact: true })).toBeVisible();

    await drawer.getByRole('button', { name: 'Projects', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    await expect(drawer).toBeHidden();
  });

  test('keeps keyboard focus inside the drawer and restores it on close', async ({ page }) => {
    await page.goto('/');

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

    await page.keyboard.press('Shift+Tab');
    await expect(drawer.getByRole('button', { name: 'Settings', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(closeButton).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
