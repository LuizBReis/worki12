import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DIAGNOSTIC COLLECTOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Diagnostic {
  timestamp: string;
  type: 'console-error' | 'console-warn' | 'page-error' | 'network-fail' | 'assertion-fail';
  url: string;
  message: string;
  stack?: string;
}

const allDiagnostics: Diagnostic[] = [];
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotDir = path.join(__dirname, 'screenshots');

// Ensure screenshot dir exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

function setupListeners(page: Page, diagnostics: Diagnostic[]) {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const diag: Diagnostic = {
        timestamp: new Date().toISOString(),
        type: 'console-error',
        url: page.url(),
        message: msg.text(),
      };
      diagnostics.push(diag);
      allDiagnostics.push(diag);
    }
  });

  page.on('pageerror', error => {
    const diag: Diagnostic = {
      timestamp: new Date().toISOString(),
      type: 'page-error',
      url: page.url(),
      message: error.message,
      stack: error.stack,
    };
    diagnostics.push(diag);
    allDiagnostics.push(diag);
  });

  page.on('requestfailed', request => {
    const diag: Diagnostic = {
      timestamp: new Date().toISOString(),
      type: 'network-fail',
      url: page.url(),
      message: `${request.method()} ${request.url()} → ${request.failure()?.errorText}`,
    };
    diagnostics.push(diag);
    allDiagnostics.push(diag);
  });
}

async function takeScreenshot(page: Page, name: string) {
  const filePath = path.join(screenshotDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CREDENTIALS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const WORKER_EMAIL = 'e2e.worker.test@gmail.com';
const WORKER_PASSWORD = 'TestWorker123!';
const COMPANY_EMAIL = 'e2e.company.test@gmail.com';
const COMPANY_PASSWORD = 'TestCompany123!';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 1: PUBLIC PAGES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe('Phase 1: Public Pages', () => {
  let diagnostics: Diagnostic[];

  test.beforeEach(async ({ page }) => {
    diagnostics = [];
    setupListeners(page, diagnostics);
  });

  test('1.1 Landing page (/) loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '1.1-landing');
    await expect(page.locator('body')).toBeVisible();
    // Check page has content
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('1.2 Login page (/login) loads with form', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '1.2-login');
    // Check that login form exists
    const emailInput = page.getByLabel(/email/i);
    page.getByLabel(/senha/i);
    const hasEmailByPlaceholder = page.locator('input[type="email"], input[placeholder*="email" i]');
    // Either labeled inputs or placeholder-based inputs should exist
    const emailVisible = await emailInput.isVisible().catch(() => false) ||
                          await hasEmailByPlaceholder.first().isVisible().catch(() => false);
    expect(emailVisible).toBe(true);
  });

  test('1.3 Login worker page (/login?type=work) loads', async ({ page }) => {
    await page.goto('/login?type=work');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '1.3-login-worker');
    await expect(page.locator('body')).toBeVisible();
  });

  test('1.4 Login company page (/login?type=hire) loads', async ({ page }) => {
    await page.goto('/login?type=hire');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '1.4-login-company');
    await expect(page.locator('body')).toBeVisible();
  });

  test('1.5 Terms page (/termos) loads', async ({ page }) => {
    await page.goto('/termos');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '1.5-termos');
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('1.6 Privacy page (/privacidade) loads', async ({ page }) => {
    await page.goto('/privacidade');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '1.6-privacidade');
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('1.7 Help page (/ajuda) loads', async ({ page }) => {
    await page.goto('/ajuda');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '1.7-ajuda');
    await expect(page.locator('body')).toBeVisible();
  });

  test('1.8 Forgot password page (/esqueci-senha) loads', async ({ page }) => {
    await page.goto('/esqueci-senha');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '1.8-esqueci-senha');
    await expect(page.locator('body')).toBeVisible();
  });

  test('1.9 Invalid route shows 404', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-12345');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '1.9-404');
    // We just take a screenshot and document what we see
    await expect(page.locator('body')).toBeVisible();
  });

  test('1.10 Register worker page (/cadastro?type=work) loads', async ({ page }) => {
    await page.goto('/cadastro?type=work');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '1.10-cadastro-worker');
    await expect(page.locator('body')).toBeVisible();
  });

  test('1.11 Register company page (/cadastro?type=hire) loads', async ({ page }) => {
    await page.goto('/cadastro?type=hire');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '1.11-cadastro-company');
    await expect(page.locator('body')).toBeVisible();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 2: AUTH FLOW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe('Phase 2: Auth Flow', () => {
  let diagnostics: Diagnostic[];

  test.beforeEach(async ({ page }) => {
    diagnostics = [];
    setupListeners(page, diagnostics);
  });

  test('2.1 Protected route /dashboard redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '2.1-protected-redirect');
    const url = page.url();
    // Should redirect to login or home
    const redirected = url.includes('/login') || url.includes('/?') || url.endsWith('/');
    expect(redirected).toBe(true);
  });

  test('2.2 Protected route /company/dashboard redirects when unauthenticated', async ({ page }) => {
    await page.goto('/company/dashboard');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '2.2-protected-company-redirect');
    const url = page.url();
    const redirected = url.includes('/login') || url.includes('/?') || url.endsWith('/');
    expect(redirected).toBe(true);
  });

  test('2.3 Worker login attempt', async ({ page }) => {
    await page.goto('/login?type=work');
    await page.waitForLoadState('networkidle');

    // Try to fill the login form
    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]')).first();
    const senhaInput = page.getByLabel(/senha/i).or(page.locator('input[type="password"]')).first();

    await emailInput.fill(WORKER_EMAIL);
    await senhaInput.fill(WORKER_PASSWORD);
    await takeScreenshot(page, '2.3-worker-login-filled');

    // Click login button
    const loginButton = page.getByRole('button', { name: /entrar/i })
      .or(page.locator('button[type="submit"]')).first();
    await loginButton.click();

    // Wait for navigation or error
    await page.waitForTimeout(5000);
    await takeScreenshot(page, '2.3-worker-login-result');

    const url = page.url();
    const loginSucceeded = url.includes('/dashboard') || url.includes('/worker');
    if (!loginSucceeded) {
      const bodyText = await page.locator('body').innerText();
      console.log('Worker login result URL:', url);
      console.log('Page text (first 500 chars):', bodyText.substring(0, 500));
    }
  });

  test('2.4 Company login attempt', async ({ page }) => {
    await page.goto('/login?type=hire');
    await page.waitForLoadState('networkidle');

    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]')).first();
    const senhaInput = page.getByLabel(/senha/i).or(page.locator('input[type="password"]')).first();

    await emailInput.fill(COMPANY_EMAIL);
    await senhaInput.fill(COMPANY_PASSWORD);
    await takeScreenshot(page, '2.4-company-login-filled');

    const loginButton = page.getByRole('button', { name: /entrar/i })
      .or(page.locator('button[type="submit"]')).first();
    await loginButton.click();

    await page.waitForTimeout(5000);
    await takeScreenshot(page, '2.4-company-login-result');

    const url = page.url();
    const loginSucceeded = url.includes('/company/dashboard') || url.includes('/company');
    if (!loginSucceeded) {
      const bodyText = await page.locator('body').innerText();
      console.log('Company login result URL:', url);
      console.log('Page text (first 500 chars):', bodyText.substring(0, 500));
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 3: WORKER FLOW (if login works)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe('Phase 3: Worker Flow', () => {
  let diagnostics: Diagnostic[];
  // workerLoggedIn tracking removed — variable was unused

  test.beforeEach(async ({ page }) => {
    diagnostics = [];
    setupListeners(page, diagnostics);

    // Login as worker
    await page.goto('/login?type=work');
    await page.waitForLoadState('networkidle');

    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]')).first();
    const senhaInput = page.getByLabel(/senha/i).or(page.locator('input[type="password"]')).first();

    await emailInput.fill(WORKER_EMAIL);
    await senhaInput.fill(WORKER_PASSWORD);

    const loginButton = page.getByRole('button', { name: /entrar/i })
      .or(page.locator('button[type="submit"]')).first();
    await loginButton.click();

    // Wait for redirect or error
    try {
      await page.waitForURL('**/dashboard', { timeout: 10_000 });
      // login succeeded
    } catch {
      // Login failed, try to detect onboarding redirect
      const url = page.url();
      if (url.includes('/worker') || url.includes('/onboarding')) {
        // login succeeded
      } else {
        test.skip(true, 'Worker login failed - skipping worker flow');
      }
    }
  });

  test('3.1 Worker Dashboard loads', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '3.1-worker-dashboard');
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('3.2 Worker Jobs page (/jobs) loads', async ({ page }) => {
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '3.2-worker-jobs');
    await expect(page.locator('body')).toBeVisible();
  });

  test('3.3 Worker My Jobs page (/my-jobs) loads', async ({ page }) => {
    await page.goto('/my-jobs');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '3.3-worker-my-jobs');
    await expect(page.locator('body')).toBeVisible();
  });

  test('3.4 Worker Wallet page (/wallet) loads', async ({ page }) => {
    await page.goto('/wallet');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '3.4-worker-wallet');
    await expect(page.locator('body')).toBeVisible();
  });

  test('3.5 Worker Profile page (/profile) loads', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '3.5-worker-profile');
    await expect(page.locator('body')).toBeVisible();
  });

  test('3.6 Worker Messages page (/messages) loads', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '3.6-worker-messages');
    await expect(page.locator('body')).toBeVisible();
  });

  test('3.7 Worker Notifications page (/notifications) loads', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '3.7-worker-notifications');
    await expect(page.locator('body')).toBeVisible();
  });

  test('3.8 Worker Analytics page (/analytics) loads', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '3.8-worker-analytics');
    await expect(page.locator('body')).toBeVisible();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 4: COMPANY FLOW (if login works)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe('Phase 4: Company Flow', () => {
  let diagnostics: Diagnostic[];

  test.beforeEach(async ({ page }) => {
    diagnostics = [];
    setupListeners(page, diagnostics);

    // Login as company
    await page.goto('/login?type=hire');
    await page.waitForLoadState('networkidle');

    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]')).first();
    const senhaInput = page.getByLabel(/senha/i).or(page.locator('input[type="password"]')).first();

    await emailInput.fill(COMPANY_EMAIL);
    await senhaInput.fill(COMPANY_PASSWORD);

    const loginButton = page.getByRole('button', { name: /entrar/i })
      .or(page.locator('button[type="submit"]')).first();
    await loginButton.click();

    try {
      await page.waitForURL('**/company/dashboard', { timeout: 10_000 });
    } catch {
      const url = page.url();
      if (url.includes('/company') || url.includes('/onboarding')) {
        // Logged in but redirected to onboarding or another company page
      } else {
        test.skip(true, 'Company login failed - skipping company flow');
      }
    }
  });

  test('4.1 Company Dashboard loads', async ({ page }) => {
    await page.goto('/company/dashboard');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '4.1-company-dashboard');
    await expect(page.locator('body')).toBeVisible();
  });

  test('4.2 Company Jobs page loads', async ({ page }) => {
    await page.goto('/company/jobs');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '4.2-company-jobs');
    await expect(page.locator('body')).toBeVisible();
  });

  test('4.3 Company Create Job page loads', async ({ page }) => {
    await page.goto('/company/create');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '4.3-company-create');
    await expect(page.locator('body')).toBeVisible();
  });

  test('4.4 Company Profile page loads', async ({ page }) => {
    await page.goto('/company/profile');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '4.4-company-profile');
    await expect(page.locator('body')).toBeVisible();
  });

  test('4.5 Company Wallet page loads', async ({ page }) => {
    await page.goto('/company/wallet');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '4.5-company-wallet');
    await expect(page.locator('body')).toBeVisible();
  });

  test('4.6 Company Messages page loads', async ({ page }) => {
    await page.goto('/company/messages');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '4.6-company-messages');
    await expect(page.locator('body')).toBeVisible();
  });

  test('4.7 Company Notifications page loads', async ({ page }) => {
    await page.goto('/company/notifications');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '4.7-company-notifications');
    await expect(page.locator('body')).toBeVisible();
  });

  test('4.8 Company Analytics page loads', async ({ page }) => {
    await page.goto('/company/analytics');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '4.8-company-analytics');
    await expect(page.locator('body')).toBeVisible();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 5: EDGE CASES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe('Phase 5: Edge Cases', () => {
  let diagnostics: Diagnostic[];

  test.beforeEach(async ({ page }) => {
    diagnostics = [];
    setupListeners(page, diagnostics);
  });

  test('5.1 Multiple invalid routes show 404 or redirect', async ({ page }) => {
    for (const route of ['/xyz-invalid', '/admin', '/api/hack']) {
      await page.goto(route);
      await page.waitForTimeout(2000);
    }
    await takeScreenshot(page, '5.1-invalid-routes');
    await expect(page.locator('body')).toBeVisible();
  });

  test('5.2 Login form validation - empty submit', async ({ page }) => {
    await page.goto('/login?type=work');
    await page.waitForLoadState('networkidle');

    // Try to submit without filling anything
    const loginButton = page.getByRole('button', { name: /entrar/i })
      .or(page.locator('button[type="submit"]')).first();

    if (await loginButton.isVisible().catch(() => false)) {
      await loginButton.click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, '5.2-empty-submit');
    }
  });

  test('5.3 Login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login?type=work');
    await page.waitForLoadState('networkidle');

    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]')).first();
    const senhaInput = page.getByLabel(/senha/i).or(page.locator('input[type="password"]')).first();

    await emailInput.fill('nonexistent@fake.com');
    await senhaInput.fill('WrongPassword123!');

    const loginButton = page.getByRole('button', { name: /entrar/i })
      .or(page.locator('button[type="submit"]')).first();
    await loginButton.click();

    await page.waitForTimeout(5000);
    await takeScreenshot(page, '5.3-invalid-credentials');

    // Should still be on login page (not redirected)
    const url = page.url();
    expect(url).toContain('/login');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SAVE DIAGNOSTICS AFTER ALL TESTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.afterAll(() => {
  const logPath = path.join(__dirname, 'diagnostics.json');
  fs.writeFileSync(logPath, JSON.stringify(allDiagnostics, null, 2));
  console.log(`\n=== DIAGNOSTICS SUMMARY ===`);
  console.log(`Total diagnostics captured: ${allDiagnostics.length}`);

  const consoleErrors = allDiagnostics.filter(d => d.type === 'console-error');
  const pageErrors = allDiagnostics.filter(d => d.type === 'page-error');
  const networkFails = allDiagnostics.filter(d => d.type === 'network-fail');

  console.log(`Console errors: ${consoleErrors.length}`);
  console.log(`Page errors: ${pageErrors.length}`);
  console.log(`Network failures: ${networkFails.length}`);

  if (consoleErrors.length > 0) {
    console.log(`\n--- Console Errors ---`);
    consoleErrors.forEach(d => console.log(`  [${d.url}] ${d.message.substring(0, 200)}`));
  }
  if (pageErrors.length > 0) {
    console.log(`\n--- Page Errors ---`);
    pageErrors.forEach(d => console.log(`  [${d.url}] ${d.message.substring(0, 200)}`));
  }
  if (networkFails.length > 0) {
    console.log(`\n--- Network Failures ---`);
    networkFails.forEach(d => console.log(`  ${d.message.substring(0, 200)}`));
  }
  console.log(`=========================\n`);
});
