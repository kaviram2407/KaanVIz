import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('KaanViz Phase 6 — Visualization & Analytics E2E Workflow', () => {
  test('uploads dataset, navigates to Visualize page, executes aggregated analytics query, and renders visualization', async ({ page }) => {
    const testCsvPath = path.join(__dirname, 'test_viz_sales.csv');
    const csvContent = (
      'category,region,revenue\n' +
      'Electronics,North,1000\n' +
      'Electronics,South,1500\n' +
      'Furniture,North,800\n' +
      'Furniture,South,1200\n'
    );
    fs.writeFileSync(testCsvPath, csvContent, 'utf-8');

    try {
      // 1. Open KaanViz Home
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

      // 4. Navigate to Visualize Studio page
      await page.click('a[href="/visualize"]');
      await page.waitForURL('/visualize');

      // 5. Verify Visualization Studio Workbench
      await expect(page.getByTestId('visualization-view')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Visualization & Analytics Studio')).toBeVisible();

      // 6. Run Analytics Query
      const runBtn = page.getByTestId('run-query-btn');
      await expect(runBtn).toBeEnabled();
      await runBtn.click();

      // 7. Verify Aggregated Data Result & Query Metadata
      await expect(page.getByText(/Query executed in/i)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/aggregated rows returned/i)).toBeVisible();
      await expect(page.getByText('Aggregated Query Result Data')).toBeVisible();

    } finally {
      if (fs.existsSync(testCsvPath)) {
        fs.unlinkSync(testCsvPath);
      }
    }
  });
});
