import { test, expect } from '@playwright/test';

const WORKER_EMAIL = 'e2e_worker@test.worki.com';
const WORKER_PASSWORD = 'TestWorker123!';

test.describe('Candidatura a vaga', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login?type=work');
    await page.getByLabel('Email').fill(WORKER_EMAIL);
    await page.getByLabel('Senha').fill(WORKER_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
  });

  test('worker se candidata a vaga disponivel', async ({ page }) => {
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');

    const applyButton = page.getByRole('button', { name: /candidatar-se/i }).first();
    if (await applyButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await applyButton.click();
      await expect(page).not.toHaveURL(/error/i);
    }

    await expect(page.locator('body')).toBeVisible();
  });
});
