import { test, expect } from '@playwright/test';

test.describe('KaanViz E2E Setup Verification', () => {
  test('should load the home page shell with navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('KaanViz Analytics Studio')).toBeVisible();
    await expect(page.getByText('See Beyond Data')).toBeVisible();
  });
});
