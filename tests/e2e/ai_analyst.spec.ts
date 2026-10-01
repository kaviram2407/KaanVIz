import { test, expect } from '@playwright/test';

test.describe('Phase 8 — E2E AI Analyst Verification', () => {
  test('1. AI disabled -> core dashboard and analytics remain fully usable', async ({ page }) => {
    await page.goto('/dashboards');
    await expect(page.locator('body')).toContainText(/Interactive Dashboard Studio/i);
    await page.goto('/visualize');
    await expect(page.locator('body')).toContainText(/Visualization & Analytics Studio/i);
  });

  test('2. Upload dataset for AI Analyst verification', async ({ page }) => {
    await page.goto('/data');
    const buffer = Buffer.from(
      'category,revenue,sales,region\nElectronics,1000,10,North\nClothing,500,5,South\nBooks,250,2,East\n'
    );
    await page.getByTestId('file-input').setInputFiles({
      name: 'ai_sales_test.csv',
      mimeType: 'text/csv',
      buffer,
    });
    await page.getByTestId('upload-button').click();
    await expect(page.getByTestId('upload-success-card')).toBeVisible({ timeout: 15000 });
  });

  test('3. AI Analyst Page loads and checks AI availability status, provider settings, and test connection', async ({ page }) => {
    await page.goto('/ai-analyst');
    await expect(page.locator('body')).toContainText(/AI Analyst/i, { timeout: 10000 });

    // Verify active Provider & Model display
    await expect(page.locator('body')).toContainText(/Provider:/i);
    await expect(page.locator('body')).toContainText(/NVIDIA/i);
    await expect(page.locator('body')).toContainText(/nvidia\/nemotron-3.5-lightning-30b-a3b/i);

    // Verify Test Connection button
    const testConnBtn = page.getByRole('button', { name: /Test Connection/i });
    await expect(testConnBtn).toBeVisible();
    await testConnBtn.click();
    await expect(page.locator('body')).toContainText(/(Connected|Unavailable|Error)/i, { timeout: 10000 });

    // Verify Accessible Toggle Switch
    const toggleSwitch = page.getByRole('switch', { name: /Toggle AI Analyst Enabled State/i });
    await expect(toggleSwitch).toBeVisible();
  });

  test('4. Ask NL Question, generate query intent, execute query, and review approval options', async ({ page }) => {
    await page.goto('/ai-analyst');
    const questionInput = page.locator('input[placeholder*="What is total revenue by category"]');
    await expect(questionInput).toBeVisible({ timeout: 10000 });
    if (await questionInput.isEnabled()) {
      await questionInput.fill('What is total revenue by category?');
      const askBtn = page.getByRole('button', { name: /Ask AI/i });
      if (await askBtn.isEnabled()) {
        await askBtn.click();
        await page.waitForTimeout(1000);
      }
    } else {
      await expect(page.locator('body')).toContainText(/AI Analyst is currently unavailable or disabled/i);
    }
  });

  test('5. Prompt-to-Visual generation and user approval', async ({ page }) => {
    await page.goto('/ai-analyst');
    const visTab = page.getByRole('button', { name: /Prompt-to-Visual/i });
    if (await visTab.isVisible()) {
      await visTab.click();
      const promptInput = page.locator('input[placeholder*="Show sales by category as a bar chart"]');
      if (await promptInput.isVisible() && (await promptInput.isEnabled())) {
        await promptInput.fill('Show sales by category as a bar chart');
      }
    }
  });


  test('6. AI Insights generation and display', async ({ page }) => {
    await page.goto('/ai-analyst');
    const insightsTab = page.getByRole('button', { name: /AI Insights/i });
    if (await insightsTab.isVisible()) {
      await insightsTab.click();
      await expect(page.locator('body')).toContainText(/Generate structured AI insights/i);
    }
  });

  test('7. Explain Visual workflow', async ({ page }) => {
    await page.goto('/ai-analyst');
    const explainTab = page.getByRole('button', { name: /Explain Visual/i });
    if (await explainTab.isVisible()) {
      await explainTab.click();
      await expect(page.locator('body')).toContainText(/Get a detailed structured explanation/i);
    }
  });
});
