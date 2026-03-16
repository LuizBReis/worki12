import { test, expect } from '@playwright/test';

const WORKER_EMAIL = 'e2e_worker@test.worki.com';
const WORKER_PASSWORD = 'TestWorker123!';
const COMPANY_EMAIL = 'e2e_company@test.worki.com';
const COMPANY_PASSWORD = 'TestCompany123!';

test.describe('Autenticacao', () => {
  test('login worker redireciona para /dashboard', async ({ page }) => {
    await page.goto('/login?type=work');
    await page.getByLabel('Email').fill(WORKER_EMAIL);
    await page.getByLabel('Senha').fill(WORKER_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('login empresa redireciona para /company/dashboard', async ({ page }) => {
    await page.goto('/login?type=hire');
    await page.getByLabel('Email').fill(COMPANY_EMAIL);
    await page.getByLabel('Senha').fill(COMPANY_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('**/company/dashboard', { timeout: 10_000 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('rota protegida redireciona nao autenticado para login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/', { timeout: 10_000 });
    await expect(page.locator('body')).toBeVisible();
  });
});
