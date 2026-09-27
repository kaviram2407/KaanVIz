import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('KaanViz Phase 2 — CSV Ingestion E2E Workflow', () => {
  test('completes end-to-end CSV upload and dataset registration', async ({ page }) => {
    const testCsvPath = path.join(__dirname, 'test_sales_valid.csv');
    const csvContent = 'id,name,category,amount,date\n1,Widget A,Hardware,99.99,2026-09-01\n2,Widget B,Software,149.50,2026-09-02\n';
    fs.writeFileSync(testCsvPath, csvContent, 'utf-8');

    try {
      // 1. Open KaanViz
      await page.goto('/');
      await expect(page.getByText('KaanViz Analytics Studio')).toBeVisible();

      // 2. Navigate to Data page using primary nav link
      await page.click('a[href="/data"]');
      await page.waitForURL('/data');
      await expect(page.getByText('Data Management & Ingestion')).toBeVisible();

      // 3. Upload test CSV
      const fileInput = page.getByTestId('file-input');
      await fileInput.setInputFiles(testCsvPath);

      // 4. Click Upload button
      const uploadButton = page.getByTestId('upload-button');
      await expect(uploadButton).toBeVisible();
      await uploadButton.click();

      // 5. Verify upload success card
      await expect(page.getByTestId('upload-success-card')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Dataset Registered Successfully')).toBeVisible();
      await expect(page.getByText('Raw Immutability Preserved')).toBeVisible();

      // 6. Verify dataset appears in registered catalog list
      await expect(page.getByTestId('dataset-catalog-list')).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('dataset-catalog-list')).toContainText('test_sales_valid.csv');
    } finally {
      if (fs.existsSync(testCsvPath)) {
        fs.unlinkSync(testCsvPath);
      }
    }
  });

  test('displays error alert on invalid non-CSV upload attempt', async ({ page }) => {
    const invalidFilePath = path.join(__dirname, 'invalid_doc_test.pdf');
    fs.writeFileSync(invalidFilePath, '%PDF-1.5 fake pdf content', 'utf-8');

    try {
      await page.goto('/data');
      await expect(page.getByText('Data Management & Ingestion')).toBeVisible();

      const fileInput = page.getByTestId('file-input');
      await fileInput.setInputFiles(invalidFilePath);

      await expect(page.getByTestId('upload-error-alert')).toBeVisible();
      await expect(page.getByText(/Invalid file format/i)).toBeVisible();
    } finally {
      if (fs.existsSync(invalidFilePath)) {
        fs.unlinkSync(invalidFilePath);
      }
    }
  });
});
