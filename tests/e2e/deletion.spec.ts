import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function uploadCsv(page: Page, csvPath: string) {
  const uploadAnotherBtn = page.getByText('Upload Another CSV');
  if (await uploadAnotherBtn.isVisible().catch(() => false)) {
    await uploadAnotherBtn.click();
  }
  const fileInput = page.getByTestId('file-input');
  await fileInput.setInputFiles(csvPath);
  const uploadBtn = page.getByTestId('upload-button');
  await expect(uploadBtn).toBeVisible();
  await uploadBtn.click();
  await expect(page.getByTestId('upload-success-card')).toBeVisible({ timeout: 10000 });
}

test.describe('KaanViz Dataset Deletion & Workspace Cleanup E2E Workflow', () => {
  test('completes upload, single dataset deletion, and workspace clear data', async ({ page }) => {
    const csv1Path = path.join(__dirname, 'e2e_del_sales1.csv');
    const csv2Path = path.join(__dirname, 'e2e_del_sales2.csv');

    fs.writeFileSync(csv1Path, 'id,product,price\n1,Widget A,10.50\n2,Widget B,20.00\n', 'utf-8');
    fs.writeFileSync(csv2Path, 'id,item,qty\n100,Item X,5\n200,Item Y,12\n', 'utf-8');

    try {
      // 1. Navigate to Data page
      await page.goto('/data');
      await expect(page.getByText(/Data Management/i)).toBeVisible();

      // 2. Upload dataset 1
      await uploadCsv(page, csv1Path);

      // 3. Verify dataset 1 appears in catalog list
      await expect(page.getByTestId('dataset-catalog-list')).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('dataset-catalog-list')).toContainText('e2e_del_sales1.csv');

      // 4. Click Delete button on dataset 1
      const deleteButtons = page.locator('[data-testid^="delete-dataset-btn-"]');
      await expect(deleteButtons.first()).toBeVisible();
      await deleteButtons.first().click();

      // 5. Verify Single Dataset Delete Modal & Warning text
      const modal = page.getByTestId('delete-dataset-modal');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText('Delete Dataset');
      await expect(modal).toContainText('Uploaded raw file');
      await expect(modal).toContainText('This action cannot be undone');

      // 6. Confirm permanent deletion
      await page.getByTestId('confirm-delete-dataset-btn').click();

      // 7. Verify dataset disappears and success notification appears
      await expect(page.getByTestId('data-page-notification')).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('data-page-notification')).toContainText('permanently deleted');

      // 8. Upload dataset 1 and dataset 2 for Workspace Clear testing
      await uploadCsv(page, csv1Path);
      await expect(page.getByTestId('dataset-catalog-list')).toContainText('e2e_del_sales1.csv');

      await uploadCsv(page, csv2Path);
      await expect(page.getByTestId('dataset-catalog-list')).toContainText('e2e_del_sales2.csv');

      // 9. Trigger Clear Workspace Data modal
      await page.getByTestId('clear-workspace-data-trigger-btn').click();
      const clearModal = page.getByTestId('clear-workspace-modal');
      await expect(clearModal).toBeVisible();

      // 10. Verify confirm button disabled with wrong input
      const clearConfirmBtn = page.getByTestId('confirm-clear-workspace-btn');
      await expect(clearConfirmBtn).toBeDisabled();

      const clearInput = page.getByTestId('clear-workspace-input');
      await clearInput.fill('clear');
      await expect(clearConfirmBtn).toBeDisabled();

      // 11. Fill exact "CLEAR" and confirm
      await clearInput.fill('CLEAR');
      await expect(clearConfirmBtn).toBeEnabled();
      await clearConfirmBtn.click();

      // 12. Verify all current workspace datasets disappear
      await expect(page.getByTestId('data-page-notification')).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('data-page-notification')).toContainText('permanently cleared');
      await expect(page.getByTestId('empty-datasets-banner')).toBeVisible();

      // 13. Verify application remains usable afterwards (re-upload dataset 1)
      await uploadCsv(page, csv1Path);
      await expect(page.getByTestId('dataset-catalog-list')).toContainText('e2e_del_sales1.csv');
    } finally {
      if (fs.existsSync(csv1Path)) fs.unlinkSync(csv1Path);
      if (fs.existsSync(csv2Path)) fs.unlinkSync(csv2Path);
    }
  });
});
