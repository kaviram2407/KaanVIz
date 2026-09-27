import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('KaanViz Phase 4 — Data Preparation E2E Workflow', () => {
  test('uploads dataset, opens preparation workbench, builds plan and applies transformations', async ({ page }) => {
    const testCsvPath = path.join(__dirname, 'test_prep_sales.csv');
    const csvContent = (
      'id,city,revenue\n' +
      '1, New York ,1000\n' +
      '2, London ,1500\n' +
      '1, New York ,1000\n'
    );
    fs.writeFileSync(testCsvPath, csvContent, 'utf-8');

    try {
      // 1. Open KaanViz
      await page.goto('/');
      await expect(page.getByText('KaanViz Analytics Studio')).toBeVisible();

      // 2. Navigate to Data page
      await page.click('a[href="/data"]');
      await page.waitForURL('/data');

      // 3. Upload test CSV
      const fileInput = page.getByTestId('file-input');
      await fileInput.setInputFiles(testCsvPath);

      const uploadButton = page.getByTestId('upload-button');
      await uploadButton.click();
      await expect(page.getByTestId('upload-success-card')).toBeVisible({ timeout: 10000 });

      // 4. Open Profile view
      const catalog = page.getByTestId('dataset-catalog-list');
      await expect(catalog).toBeVisible({ timeout: 15000 });
      const profileBtn = catalog.getByText('Profile').first();
      await profileBtn.click();

      await expect(page.getByTestId('dataset-profile-view')).toBeVisible({ timeout: 15000 });

      // 5. Switch to Data Preparation & Cleaning tab
      const prepTab = page.getByRole('button', { name: 'Data Preparation & Cleaning' });
      await expect(prepTab).toBeVisible({ timeout: 10000 });
      await prepTab.click();

      // 6. Verify Preparation Workbench & Data Preview
      await expect(page.getByTestId('preparation-view')).toBeVisible();
      await expect(page.getByText('Data Preparation & Cleaning Workbench')).toBeVisible();
      await expect(page.getByTestId('data-preview-card')).toBeVisible();
      await expect(page.getByText('Data Preview')).toBeVisible();

      // 7. Test Interactive Column Header Type Selection
      const typeHeaderBtn = page.getByTitle(/Change column .* type/i).first();
      await expect(typeHeaderBtn).toBeVisible();
      await typeHeaderBtn.click();

      const typeOption = page.getByRole('button', { name: 'VARCHAR' });
      await expect(typeOption).toBeVisible();
      await typeOption.click();

      // Verify queued operation
      await expect(page.getByText('convert_type')).toBeVisible();

      // 8. Test Dry-Run "Preview Changes"
      const previewBtn = page.getByRole('button', { name: 'Preview Changes' }).first();
      await expect(previewBtn).toBeEnabled();
      await previewBtn.click();

      // Verify dry-run preview active badge / summary message
      await expect(page.getByText(/Dry-Run Preview Active|Preview:/i)).toBeVisible({ timeout: 10000 });

      // 9. Apply Preparation Plan
      const applyBtn = page.getByRole('button', { name: 'Apply Plan' }).first();
      await expect(applyBtn).toBeEnabled();
      await applyBtn.click();

      // 10. Verify Applied Success & Active Version Update
      await expect(page.getByText('Preparation Plan Executed Successfully!').first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Transformation Lineage')).toBeVisible();
    } finally {
      if (fs.existsSync(testCsvPath)) {
        fs.unlinkSync(testCsvPath);
      }
    }
  });
});
