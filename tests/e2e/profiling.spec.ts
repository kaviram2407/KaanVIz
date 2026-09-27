import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('KaanViz Phase 3 — Profiling E2E Workflow', () => {
  test('uploads dataset and opens deterministic dataset profile view', async ({ page }) => {
    const testCsvPath = path.join(__dirname, 'test_sales_profile.csv');
    const csvContent = (
      'id,product,price,is_active,created_at\n' +
      '1,Laptop,1200.50,true,2026-05-10\n' +
      '2,Mouse,25.00,false,2026-05-11\n' +
      '3,Keyboard,75.00,true,2026-05-12\n'
    );
    fs.writeFileSync(testCsvPath, csvContent, 'utf-8');

    try {
      // 1. Open KaanViz
      await page.goto('/');
      await expect(page.getByText('KaanViz Analytics Studio')).toBeVisible();

      // 2. Navigate to Data page
      await page.click('a[href="/data"]');
      await page.waitForURL('/data');
      await expect(page.getByText(/Data Management/i)).toBeVisible();

      // 3. Upload test CSV
      const fileInput = page.getByTestId('file-input');
      await fileInput.setInputFiles(testCsvPath);

      const uploadButton = page.getByTestId('upload-button');
      await expect(uploadButton).toBeVisible();
      await uploadButton.click();

      // 4. Verify upload success card
      await expect(page.getByTestId('upload-success-card')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Dataset Registered Successfully')).toBeVisible();

      // 5. Open Profile by clicking on the dataset filename in catalog
      const catalog = page.getByTestId('dataset-catalog-list');
      await expect(catalog).toBeVisible({ timeout: 15000 });
      
      const itemText = catalog.getByText(/test_sales_profile\.csv/i).first();
      await expect(itemText).toBeVisible({ timeout: 15000 });
      await itemText.click();

      // 6. Verify Dataset Profile View
      await expect(page.getByTestId('dataset-profile-view')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/Test Sales Profile/i)).toBeVisible();
      await expect(page.getByText(/Score: 100%/i)).toBeVisible();

      // 7. Verify Column Profiles in Profile Table
      const tbody = page.locator('tbody');
      await expect(tbody).toBeVisible({ timeout: 10000 });
      await expect(tbody).toContainText('product');
      await expect(tbody).toContainText('price');
      await expect(tbody).toContainText('is_active');
      await expect(tbody).toContainText('created_at');
      await expect(tbody).toContainText('DECIMAL');
      await expect(tbody).toContainText('BOOLEAN');
    } finally {
      if (fs.existsSync(testCsvPath)) {
        fs.unlinkSync(testCsvPath);
      }
    }
  });
});
