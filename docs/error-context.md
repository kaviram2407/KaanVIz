# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> KaanViz Phase 7 — Dashboard Builder E2E Workflow >> uses Power BI-style side authoring panel to add KPI Card, configure simple measures and verify persistence
- Location: tests/e2e/dashboard.spec.ts:90:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Executive Revenue KPI')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Executive Revenue KPI') with timeout 15000ms
  - waiting for getByText('Executive Revenue KPI')

```

```yaml
- banner:
  - link "KaanViz Logo KaanViz v0.1.0 See Beyond Data":
    - /url: /
    - img "KaanViz Logo"
    - text: KaanViz v0.1.0
    - paragraph: See Beyond Data
  - text: "Backend: healthy"
  - img
  - text: "DB: ok"
  - img
  - text: "Redis: ok"
  - img
  - text: "Storage: ok"
  - img
  - text: "AI: disabled"
- navigation:
  - link "Home":
    - /url: /
    - img
    - text: Home
  - link "Data":
    - /url: /data
    - img
    - text: Data
  - link "Prepare":
    - /url: /prepare
    - img
    - text: Prepare
  - link "Model":
    - /url: /model
    - img
    - text: Model
  - link "Visualize":
    - /url: /visualize
    - img
    - text: Visualize
  - link "Dashboards":
    - /url: /dashboards
    - img
    - text: Dashboards
  - link "AI Analyst Optional":
    - /url: /ai-analyst
    - img
    - text: AI Analyst Optional
  - link "Settings":
    - /url: /settings
    - img
    - text: Settings
  - link "Help":
    - /url: /help
    - img
    - text: Help
  - link "About":
    - /url: /about
    - img
    - text: About
- main:
  - heading "Interactive Dashboard Studio" [level=2]:
    - img
    - text: Interactive Dashboard Studio
  - paragraph: "Power BI-style authoring workbench: drag, configure, filter, and persist analytics dashboards."
  - img
  - combobox:
    - option "KPI Authoring Dash 1790516633408 (0 visuals)" [selected]
    - option "E2E Sales Dashboard (1 visuals)"
    - option "KPI Authoring Dash 1790516547370 (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "KPI Authoring Dash 1790516118564 (1 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "KPI Authoring Dash 1790516051026 (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "KPI Authoring Dash 1790515969703 (1 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "KPI Authoring Dash 1790515913029 (1 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "KPI Authoring Dash 1790515736804 (1 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "KPI Authoring Dashboard (2 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "KPI Authoring Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "Measure Test Dash (2 visuals)"
    - option "E2E Sales Dashboard (3 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (1 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
    - option "E2E Sales Dashboard (0 visuals)"
  - button "New Dashboard":
    - img
    - text: New Dashboard
  - button "View Mode":
    - img
    - text: View Mode
  - button "Edit Mode":
    - img
    - text: Edit Mode
  - button "Delete current dashboard":
    - img
  - img
  - text: Global Dashboard Filters & Cross-Filters No active filters. Add a filter or click a visualization item to cross-filter dashboard visuals.
  - textbox "Field name (e.g. category)"
  - textbox "Filter value (e.g. Electronics)"
  - button "Apply Filter"
  - img
  - text: Dashboard 'KPI Authoring Dash 1790516633408' is empty Drag a visual type from the side Authoring Panel onto this canvas, or click 'Add Visualization'.
  - button "Add First Visualization":
    - img
    - text: Add First Visualization
- contentinfo: KaanViz Analytics Engine © 2026. All rights reserved. AI is an enhancement, not a dependency. Raw data remains immutable.
- alert
```

# Test source

```ts
  68  |       await page.fill('input[placeholder="Field name (e.g. category)"]', 'category');
  69  |       await page.fill('input[placeholder="Filter value (e.g. Electronics)"]', 'Electronics');
  70  |       await page.click('button:has-text("Apply Filter")');
  71  | 
  72  |       // Verify filter badge & filtered badge on widget
  73  |       await expect(page.getByText('Filtered').first()).toBeVisible({ timeout: 10000 });
  74  | 
  75  |       // 9. Reset Filters
  76  |       await page.click('button:has-text("Reset All Filters")');
  77  |       await expect(page.getByText('No active filters.')).toBeVisible();
  78  | 
  79  |       // 10. Save Layout & Verify Persistence
  80  |       await page.click('button:has-text("Save Layout")');
  81  |       await expect(page.getByText('Dashboard layout and filters saved successfully.')).toBeVisible({ timeout: 10000 });
  82  | 
  83  |     } finally {
  84  |       if (fs.existsSync(testCsvPath)) {
  85  |         fs.unlinkSync(testCsvPath);
  86  |       }
  87  |     }
  88  |   });
  89  | 
  90  |   test('uses Power BI-style side authoring panel to add KPI Card, configure simple measures and verify persistence', async ({ page }) => {
  91  |     const testCsvPath = path.join(__dirname, 'test_kpi_dash.csv');
  92  |     const csvContent = 'department,revenue\nSales,50000\nMarketing,30000\nEngineering,75000\n';
  93  |     fs.writeFileSync(testCsvPath, csvContent, 'utf-8');
  94  | 
  95  |     const dashName = `KPI Authoring Dash ${Date.now()}`;
  96  | 
  97  |     try {
  98  |       // 1. Upload CSV Dataset
  99  |       await page.goto('/data');
  100 |       await page.waitForURL('/data');
  101 |       await page.getByTestId('file-input').setInputFiles(testCsvPath);
  102 |       await page.getByTestId('upload-button').click();
  103 |       await expect(page.getByTestId('upload-success-card')).toBeVisible({ timeout: 10000 });
  104 | 
  105 |       // 2. Navigate to /dashboards
  106 |       await page.goto('/dashboards');
  107 |       await page.waitForURL('/dashboards');
  108 |       await expect(page.getByTestId('dashboard-builder-view')).toBeVisible({ timeout: 10000 });
  109 | 
  110 |       // 3. Create fresh dashboard for KPI authoring
  111 |       await page.click('button:has-text("New Dashboard")');
  112 |       await page.fill('input[placeholder="e.g. Q3 Sales & Operations"]', dashName);
  113 |       await page.click('button:has-text("Create")');
  114 |       await expect(page.getByText(`Dashboard '${dashName}' created successfully.`)).toBeVisible({ timeout: 10000 });
  115 |       await expect(page.getByText('Loading dashboard items...')).not.toBeVisible({ timeout: 10000 });
  116 |       await expect(page.getByText(`Dashboard '${dashName}' is empty`)).toBeVisible({ timeout: 10000 });
  117 | 
  118 |       // 4. Switch to Edit Mode & verify Authoring Panel
  119 |       await page.getByRole('button', { name: 'Edit Mode' }).click();
  120 | 
  121 |       const authoringPanel = page.getByTestId('dashboard-authoring-panel');
  122 |       if (!(await authoringPanel.isVisible())) {
  123 |         const toggleBtn = page.getByTestId('toggle-authoring-panel-btn');
  124 |         if (await toggleBtn.isVisible()) {
  125 |           await toggleBtn.click();
  126 |         }
  127 |       }
  128 |       await expect(page.getByTestId('dashboard-authoring-panel')).toBeVisible({ timeout: 15000 });
  129 | 
  130 |       // 5. Select Data tab to verify active dataset, then Visuals tab & Add KPI Card
  131 |       await page.click('button[data-testid="tab-data"]');
  132 |       await expect(page.locator('select[data-testid="panel-dataset-select"] option')).not.toHaveCount(0, { timeout: 10000 });
  133 | 
  134 |       await page.click('button[data-testid="tab-visuals"]');
  135 |       await page.getByTestId('add-visual-kpi').click();
  136 |       await expect(page.getByText(/Added KPI visual to dashboard|Visualization widget added/i)).toBeVisible({ timeout: 10000 });
  137 | 
  138 |       // 6. Select Build tab in Authoring Panel & configure KPI Simple Measure
  139 |       await page.click('button[data-testid="tab-build"]');
  140 |       await expect(page.getByTestId('config-title-input')).toBeVisible({ timeout: 5000 });
  141 |       await page.fill('input[data-testid="config-title-input"]', 'Executive Revenue KPI');
  142 | 
  143 |       // Configure Format & Measure Name
  144 |       await page.selectOption('select[data-testid="config-kpi-format-select"]', 'currency');
  145 |       await page.fill('input[data-testid="config-kpi-name-input"]', 'Total Net Revenue');
  146 | 
  147 |       // 7. Save Layout & Reload
  148 |       await page.click('button:has-text("Save Layout")');
  149 |       await expect(page.getByText('Dashboard layout and filters saved successfully.')).toBeVisible({ timeout: 10000 });
  150 | 
  151 |       await page.reload();
  152 |       await page.waitForURL('/dashboards');
  153 |       await expect(page.getByTestId('dashboard-builder-view')).toBeVisible({ timeout: 10000 });
  154 | 
  155 |       // Select the unique KPI Authoring Dashboard from dropdown
  156 |       await expect(page.locator('select[data-testid="dashboard-selector"] option')).not.toHaveCount(0, { timeout: 10000 });
  157 |       const dashSelect = page.locator('select[data-testid="dashboard-selector"]');
  158 |       const optionVal = await dashSelect.locator('option', { hasText: dashName }).first().getAttribute('value');
  159 |       if (optionVal) {
  160 |         await dashSelect.click();
  161 |         await dashSelect.selectOption(optionVal);
  162 |         await dashSelect.dispatchEvent('change');
  163 |         await page.waitForTimeout(1000);
  164 |       }
  165 |       await expect(page.getByText('Loading dashboard items...')).not.toBeVisible({ timeout: 10000 });
  166 | 
  167 |       // 8. Verify KPI Card & title persisted after reload
> 168 |       await expect(page.getByText('Executive Revenue KPI')).toBeVisible({ timeout: 15000 });
      |                                                             ^ Error: expect(locator).toBeVisible() failed
  169 |     } finally {
  170 |       if (fs.existsSync(testCsvPath)) {
  171 |         fs.unlinkSync(testCsvPath);
  172 |       }
  173 |     }
  174 |   });
  175 | });
  176 | 
```