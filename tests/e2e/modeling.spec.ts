import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('KaanViz Phase 5 — Data Modeling & Relationships E2E Workflow', () => {
  test('uploads datasets, binds them to data model, validates and applies relationships', async ({ page }) => {
    const ordersCsvPath = path.join(__dirname, 'e2e_orders.csv');
    const customersCsvPath = path.join(__dirname, 'e2e_customers.csv');

    const ordersContent = 'order_id,cust_id,total\n101,1,250.00\n102,2,120.50\n103,1,99.99\n';
    const customersContent = 'cust_id,cust_name,city\n1,Alice,New York\n2,Bob,London\n';

    fs.writeFileSync(ordersCsvPath, ordersContent, 'utf-8');
    fs.writeFileSync(customersCsvPath, customersContent, 'utf-8');

    try {
      // 1. Open home page
      await page.goto('/');
      await expect(page.getByText('KaanViz Analytics Studio')).toBeVisible();

      // 2. Navigate to Data upload page
      await page.click('a[href="/data"]');
      await page.waitForURL('/data');

      // Upload orders CSV
      const fileInput1 = page.getByTestId('file-input');
      await fileInput1.setInputFiles(ordersCsvPath);
      await page.getByTestId('upload-button').click();
      await expect(page.getByTestId('upload-success-card')).toBeVisible({ timeout: 10000 });

      // Upload customers CSV
      await page.goto('/data');
      const fileInput2 = page.getByTestId('file-input');
      await fileInput2.setInputFiles(customersCsvPath);
      await page.getByTestId('upload-button').click();
      await expect(page.getByTestId('upload-success-card')).toBeVisible({ timeout: 10000 });

      // 3. Navigate to Data Modeling workspace
      await page.click('a[href="/model"]');
      await page.waitForURL('/model');

      await expect(page.getByText('Data Modeling & Relationships')).toBeVisible({ timeout: 20000 });

      // 4. Ensure datasets are bound to model
      while ((await page.getByRole('button', { name: 'Add to Model' }).count()) > 0) {
        await page.getByRole('button', { name: 'Add to Model' }).first().click();
        await page.waitForTimeout(500);
      }

      // 5. Verify Model Schema & Fields
      await expect(page.getByText('Model Schema & Fields')).toBeVisible();
      await expect(page.getByText('Create Explicit Relationship')).toBeVisible();

      // Clean existing relationships if any
      const trashBtns = page.locator('button[title="Remove Relationship"]');
      while ((await trashBtns.count()) > 0) {
        await trashBtns.first().click();
        await page.waitForTimeout(300);
      }

      // 6. Test Negative Relationship Case (Self-reference attempt)
      const selects = page.locator('select');
      const srcTableSelect = selects.nth(0);
      const srcFieldSelect = selects.nth(1);
      const tgtTableSelect = selects.nth(2);
      const tgtFieldSelect = selects.nth(3);
      const cardinalitySelect = selects.nth(4);

      // Select same dataset for source and target
      const optionValues = await srcTableSelect.locator('option').evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));
      const validOptionValues = optionValues.filter((v) => v !== '');

      if (validOptionValues.length >= 2) {
        const ds1 = validOptionValues[0];
        const ds2 = validOptionValues[1];

        // Select same source and target table (self-reference)
        await srcTableSelect.selectOption(ds1);
        await expect(srcFieldSelect.locator('option')).not.toHaveCount(1, { timeout: 5000 });
        await srcFieldSelect.selectOption({ index: 1 });

        await tgtTableSelect.selectOption(ds1);
        await expect(tgtFieldSelect.locator('option')).not.toHaveCount(1, { timeout: 5000 });
        await tgtFieldSelect.selectOption({ index: 1 });

        // Click Validate Relationship
        await page.getByRole('button', { name: 'Validate Relationship' }).click();

        // Verify Validation Failure rendered
        await expect(page.getByText('Validation Failed')).toBeVisible({ timeout: 5000 });

        // 7. Test Valid Relationship Case (ds1 -> ds2)
        await srcTableSelect.selectOption(ds1);
        await page.waitForTimeout(300);
        await srcFieldSelect.selectOption({ index: 1 });

        await tgtTableSelect.selectOption(ds2);
        await page.waitForTimeout(300);
        await tgtFieldSelect.selectOption({ index: 1 });

        await cardinalitySelect.selectOption('many_to_one');

        // Click Validate Relationship
        await page.getByRole('button', { name: 'Validate Relationship' }).click();

        // Verify Valid Relationship Proposal
        await expect(page.getByText('Valid Relationship Proposal')).toBeVisible({ timeout: 5000 });

        // Click Apply Relationship
        await page.getByRole('button', { name: 'Apply Relationship' }).click();

        // Verify Relationship appears in Applied Model Relationships table
        await expect(page.getByText('Applied Model Relationships')).toBeVisible({ timeout: 5000 });
        await expect(page.getByRole('table').getByText('many_to_one')).toBeVisible();
      }
    } finally {
      if (fs.existsSync(ordersCsvPath)) fs.unlinkSync(ordersCsvPath);
      if (fs.existsSync(customersCsvPath)) fs.unlinkSync(customersCsvPath);
    }
  });
});
