import { expect, test } from '@playwright/test';

test('renders the empty outreach workspace foundation', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Your outreach, at a glance.' })).toBeVisible();
  await expect(page.getByTestId('dashboard')).toBeVisible();
  await expect(page.getByText('No projects connected')).toBeVisible();
  await expect(page.getByText('No activity recorded yet')).toBeVisible();
});
