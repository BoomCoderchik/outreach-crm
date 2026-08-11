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
});
