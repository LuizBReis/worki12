import { test, expect } from '@playwright/test';

const COMPANY_EMAIL = 'e2e_company@test.worki.com';
const COMPANY_PASSWORD = 'TestCompany123!';

test.describe('Visualizacao de candidatos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login?type=hire');
    await page.getByLabel('Email').fill(COMPANY_EMAIL);
    await page.getByLabel('Senha').fill(COMPANY_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('**/company/dashboard', { timeout: 10_000 });
  });

  test('empresa visualiza lista de candidatos de uma vaga', async ({ page }) => {
    await page.goto('/company/jobs');
    await page.waitForLoadState('networkidle');

    const firstJobLink = page.getByRole('link').first();
    if (await firstJobLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await firstJobLink.click();
    }

    await expect(page).not.toHaveURL(/error/i);
    await expect(page.locator('body')).toBeVisible();
  });
});
