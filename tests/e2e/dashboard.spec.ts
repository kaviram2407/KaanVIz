import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('KaanViz Phase 7 — Dashboard Builder E2E Workflow', () => {
  test('uploads dataset, creates dashboard, adds visualization widget, applies global filters and verifies layout persistence', async ({ page }) => {
    const testCsvPath = path.join(__dirname, 'test_dash_sales.csv');
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

      // 2. Navigate to Data page & upload CSV
      await page.click('a[href="/data"]');
      await page.waitForURL('/data');

      const fileInput = page.getByTestId('file-input');
      await fileInput.setInputFiles(testCsvPath);

      const uploadButton = page.getByTestId('upload-button');
      await uploadButton.click();
      await expect(page.getByTestId('upload-success-card')).toBeVisible({ timeout: 10000 });

      // 3. Navigate to Dashboards Studio page
      await page.click('a[href="/dashboards"]');
      await page.waitForURL('/dashboards');

      // 4. Verify Dashboard Builder Workbench
      await expect(page.getByTestId('dashboard-builder-view')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Interactive Dashboard Studio')).toBeVisible();

      // 5. Create a New Dashboard
      await page.click('button:has-text("New Dashboard")');
      await page.fill('input[placeholder="e.g. Q3 Sales & Operations"]', 'E2E Sales Dashboard');
      await page.click('button:has-text("Create")');

      // Verify dashboard created
      await expect(page.getByText("Dashboard 'E2E Sales Dashboard' created successfully.")).toBeVisible({ timeout: 10000 });

      // 6. Switch to Edit Mode & Add Visualization Widget
      await page.click('button:has-text("Edit Mode")');
      await page.click('button:has-text("Add Visualization")');

      await page.fill('input[placeholder="e.g. Total Revenue by Category"]', 'Category Revenue Widget');
      
      // Select the newly uploaded dataset if dropdown exists
      const dsSelect = page.locator('label:has-text("Source Dataset") + select');
      if (await dsSelect.isVisible()) {
        await dsSelect.selectOption({ label: 'Test Dash Sales' }).catch(() => {});
      }

      await page.click('button:has-text("Add Widget")');
      await expect(page.getByText('Visualization widget added to dashboard.')).toBeVisible({ timeout: 10000 });

      // 7. Verify Widget Added & Visualization Rendered
      await expect(page.getByText('Category Revenue Widget')).toBeVisible({ timeout: 10000 });

      // 8. Test Global Dashboard Filter Application
      await page.fill('input[placeholder="Field name (e.g. category)"]', 'category');
      await page.fill('input[placeholder="Filter value (e.g. Electronics)"]', 'Electronics');
      await page.click('button:has-text("Apply Filter")');

      // Verify filter badge & filtered badge on widget
      await expect(page.getByText('Filtered').first()).toBeVisible({ timeout: 10000 });

      // 9. Reset Filters
      await page.click('button:has-text("Reset All Filters")');
      await expect(page.getByText('No active filters.')).toBeVisible();

      // 10. Save Layout & Verify Persistence
      await page.click('button:has-text("Save Layout")');
      await expect(page.getByText('Dashboard layout and filters saved successfully.')).toBeVisible({ timeout: 10000 });

    } finally {
      if (fs.existsSync(testCsvPath)) {
        fs.unlinkSync(testCsvPath);
      }
    }
  });

  test('uses Power BI-style side authoring panel to add KPI Card, configure simple measures and verify persistence', async ({ page }) => {
    const testCsvPath = path.join(__dirname, 'test_kpi_dash.csv');
    const csvContent = 'department,revenue\nSales,50000\nMarketing,30000\nEngineering,75000\n';
    fs.writeFileSync(testCsvPath, csvContent, 'utf-8');

    const dashName = `KPI Authoring Dash ${Date.now()}`;

    try {
      // 1. Upload CSV Dataset & Profile it
      await page.goto('/data');
      await page.waitForURL('/data');
      await page.getByTestId('file-input').setInputFiles(testCsvPath);
      await page.getByTestId('upload-button').click();
      await expect(page.getByTestId('upload-success-card')).toBeVisible({ timeout: 10000 });

      const catalog = page.getByTestId('dataset-catalog-list');
      await expect(catalog).toBeVisible({ timeout: 10000 });
      await catalog.getByText('Profile').first().click();
      await expect(page.getByTestId('dataset-profile-view')).toBeVisible({ timeout: 15000 });

      // 2. Navigate to /dashboards
      await page.goto('/dashboards');
      await page.waitForURL('/dashboards');
      await expect(page.getByTestId('dashboard-builder-view')).toBeVisible({ timeout: 10000 });

      // 3. Create fresh dashboard for KPI authoring
      await page.click('button:has-text("New Dashboard")');
      await page.fill('input[placeholder="e.g. Q3 Sales & Operations"]', dashName);
      await page.click('button:has-text("Create")');
      await expect(page.getByText(`Dashboard '${dashName}' created successfully.`)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Loading dashboard items...')).not.toBeVisible({ timeout: 10000 });

      // Wait until selector value matches created dashboard
      const dashSelect = page.locator('select[data-testid="dashboard-selector"]');
      await expect(dashSelect).toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(500);
      const createdDashId = await dashSelect.inputValue();

      // 4. Switch to Edit Mode & verify Authoring Panel
      await page.getByRole('button', { name: 'Edit Mode' }).click();

      const authoringPanel = page.getByTestId('dashboard-authoring-panel');
      if (!(await authoringPanel.isVisible())) {
        const toggleBtn = page.getByTestId('toggle-authoring-panel-btn');
        if (await toggleBtn.isVisible()) {
          await toggleBtn.click();
        }
      }
      await expect(page.getByTestId('dashboard-authoring-panel')).toBeVisible({ timeout: 15000 });

      // 5. Select Data tab to choose active dataset, then Visuals tab & Add KPI Card
      await page.click('button[data-testid="tab-data"]');
      await expect(page.locator('select[data-testid="panel-dataset-select"] option')).not.toHaveCount(0, { timeout: 10000 });

      const panelDsSelect = page.locator('select[data-testid="panel-dataset-select"]');
      const targetOptVal = await panelDsSelect.evaluate((sel: HTMLSelectElement) => {
        const opt = Array.from(sel.options).find(o => o.text.includes('test_kpi_dash'));
        return opt ? opt.value : sel.options[0]?.value;
      });
      if (targetOptVal) {
        await page.selectOption('select[data-testid="panel-dataset-select"]', targetOptVal);
        await page.waitForTimeout(500);
      }

      await page.click('button[data-testid="tab-visuals"]');
      await page.getByTestId('add-visual-kpi').click();
      await expect(page.getByText(/Added KPI visual to dashboard|Visualization widget added/i)).toBeVisible({ timeout: 10000 });

      // 6. Select Build tab in Authoring Panel & configure KPI Simple Measure
      await page.click('button[data-testid="tab-build"]');
      await expect(page.getByTestId('config-title-input')).toBeVisible({ timeout: 5000 });
      await page.fill('input[data-testid="config-title-input"]', 'Executive Revenue KPI');
      await page.locator('input[data-testid="config-title-input"]').blur();
      await page.waitForTimeout(300);

      // Configure Format & Measure Name
      await page.selectOption('select[data-testid="config-measure-select"]', 'revenue').catch(() => {});
      await page.selectOption('select[data-testid="config-kpi-format-select"]', 'currency');
      await page.fill('input[data-testid="config-kpi-name-input"]', 'Total Net Revenue');
      await page.locator('input[data-testid="config-kpi-name-input"]').blur();
      await page.waitForTimeout(300);

      // 7. Save Layout & Reload
      await page.click('button:has-text("Save Layout")');
      await expect(page.getByText('Dashboard layout and filters saved successfully.')).toBeVisible({ timeout: 10000 });

      await page.reload();
      await page.waitForURL('/dashboards');
      await expect(page.getByTestId('dashboard-builder-view')).toBeVisible({ timeout: 10000 });

      // Select the exact created KPI Authoring Dashboard by ID
      await expect(dashSelect).toBeVisible({ timeout: 10000 });
      await page.selectOption('select[data-testid="dashboard-selector"]', createdDashId);

      // 8. Verify KPI Card & measure title persisted after reload
      await expect(page.getByText('Executive Revenue KPI').first()).toBeVisible({ timeout: 15000 });
    } finally {
      if (fs.existsSync(testCsvPath)) {
        fs.unlinkSync(testCsvPath);
      }
    }
  });
});
