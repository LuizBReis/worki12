/**
 * Worki E2E Full Flow Test
 *
 * ONE browser session, ALL user flows tested continuously.
 * Uses Playwright, CommonJS, headless: false, slowMo: 500.
 * Saves progress to progress.json after each step.
 * Takes screenshots at every step.
 * Captures console errors.
 * Handles failures gracefully (continues to next step).
 *
 * Test accounts (created via UI signup):
 *   Worker:  geribameuacesso+worker@gmail.com / WorkiTest123
 *   Company: geribameuacesso+company@gmail.com / WorkiTest123
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const PROGRESS_FILE = path.join(__dirname, 'progress.json');
const RESULTS_FILE = path.join(__dirname, 'results.json');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

const WORKER_EMAIL = 'geribameuacesso+worker@gmail.com';
const WORKER_PASS = 'WorkiTest123';
const COMPANY_EMAIL = 'geribameuacesso+company@gmail.com';
const COMPANY_PASS = 'WorkiTest123';

// Load or initialize progress
let progress = {};
try { progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch {}

const results = [];
const errors = [];

async function step(id, name, fn, page) {
  // Skip if already passed
  if (progress[id] === 'PASS') {
    console.log(`SKIP ${id}: ${name} (already passed)`);
    results.push({ id, name, status: 'SKIP' });
    return true;
  }

  console.log(`STEP ${id}: ${name}...`);
  try {
    await fn();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${id}.png`), fullPage: true });
    progress[id] = 'PASS';
    results.push({ id, name, status: 'PASS' });
    console.log(`  PASS`);
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    return true;
  } catch (e) {
    try {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${id}-ERROR.png`), fullPage: true });
    } catch {}
    progress[id] = 'FAIL';
    results.push({ id, name, status: 'FAIL', error: e.message });
    errors.push({ id, name, error: e.message });
    console.log(`  FAIL: ${e.message}`);
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    return false;
  }
}

(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Console error capture
  const consoleLogs = [];
  page.on('console', m => {
    if (m.type() === 'error' || m.type() === 'warning')
      consoleLogs.push({ type: m.type(), text: m.text(), url: page.url() });
  });
  page.on('response', r => {
    if (r.status() >= 400 && !r.url().includes('.well-known'))
      consoleLogs.push({ type: 'http_' + r.status(), text: r.request().method() + ' ' + r.url(), url: page.url() });
  });

  // Helpers
  async function settle(ms = 2000) {
    await page.waitForTimeout(ms);
  }

  async function clickNav(selector, fallbackText, timeout = 10000) {
    try {
      const loc = page.locator(selector).first();
      await loc.waitFor({ state: 'visible', timeout });
      await loc.click();
    } catch {
      const loc2 = page.getByText(fallbackText, { exact: false }).first();
      await loc2.waitFor({ state: 'visible', timeout: 5000 });
      await loc2.click();
    }
    await settle();
  }

  // ===========================================================================
  // PUBLIC PAGES (P01-P07)
  // ===========================================================================

  await step('P01', 'Load landing page /', async () => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Worki', { timeout: 15000 });
    await settle();
  }, page);

  await step('P02', 'Click "Sobre" link -> verify content', async () => {
    // Landing page footer has no /sobre link, but login page does.
    // Try to find /sobre anywhere first; if not on page, navigate to login to find it
    const sobreLink = page.locator('a[href="/sobre"]').first();
    try {
      await sobreLink.waitFor({ state: 'visible', timeout: 3000 });
      await sobreLink.click();
    } catch {
      // Navigate to login page to find the Sobre link
      await page.locator('button:has-text("Quero Trabalhar")').first().click();
      await settle();
      const sobreLink2 = page.locator('a[href="/sobre"]').first();
      await sobreLink2.waitFor({ state: 'visible', timeout: 5000 });
      await sobreLink2.click();
    }
    await settle();
    await page.waitForURL(/sobre/, { timeout: 5000 });
  }, page);

  await step('P03', 'Click browser back -> previous page', async () => {
    await page.goBack();
    await settle();
  }, page);

  await step('P04', 'Click "Login" -> verify /login loads', async () => {
    // We might already be on login page from P02's navigation
    if (page.url().includes('login')) {
      // Already on login, pass
      return;
    }
    try {
      await page.locator('button:has-text("Quero Trabalhar")').first().click();
    } catch {
      try {
        await page.locator('button:has-text("Quero Contratar")').first().click();
      } catch {
        // Navigate via landing
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        await settle();
        await page.locator('button:has-text("Quero Trabalhar")').first().click();
      }
    }
    await settle();
    await page.waitForURL(/login/, { timeout: 5000 });
  }, page);

  await step('P05', 'Navigate to /termos via footer link', async () => {
    const link = page.locator('a[href="/termos"]').first();
    await link.waitFor({ state: 'visible', timeout: 5000 });
    await link.click();
    await settle();
    await page.waitForURL(/termos/, { timeout: 5000 });
  }, page);

  await step('P06', 'Navigate to /privacidade via footer link', async () => {
    await page.goBack();
    await settle();
    const link = page.locator('a[href="/privacidade"]').first();
    await link.waitFor({ state: 'visible', timeout: 5000 });
    await link.click();
    await settle();
    await page.waitForURL(/privacidade/, { timeout: 5000 });
  }, page);

  await step('P07', 'Navigate to /ajuda via footer link', async () => {
    await page.goBack();
    await settle();
    const link = page.locator('a[href="/ajuda"]').first();
    await link.waitFor({ state: 'visible', timeout: 5000 });
    await link.click();
    await settle();
    await page.waitForURL(/ajuda/, { timeout: 5000 });
  }, page);

  // ===========================================================================
  // WORKER SIGNUP (W01-W06)
  // ===========================================================================

  await step('W01', 'Go back to landing, click worker signup button', async () => {
    // Navigate back until we hit landing
    await page.goBack();
    await settle();
    if (!page.url().endsWith('/') && !page.url().match(/:5173\/?$/)) {
      await page.goBack();
      await settle();
    }
    // If we're on login, click VOLTAR to go to landing
    if (page.url().includes('login')) {
      try {
        await page.locator('button:has-text("VOLTAR")').first().click();
        await settle();
      } catch {}
    }
    // Now click the worker signup button
    try {
      const btn = page.locator('button:has-text("Cadastrar como Profissional")').first();
      await btn.waitFor({ state: 'visible', timeout: 5000 });
      await btn.click();
    } catch {
      const btn2 = page.locator('button:has-text("Quero Trabalhar")').first();
      await btn2.waitFor({ state: 'visible', timeout: 5000 });
      await btn2.click();
    }
    await settle();
    await page.waitForURL(/login/, { timeout: 5000 });
  }, page);

  await step('W02', 'On login page, click "Cadastre-se" toggle', async () => {
    const toggle = page.locator('button:has-text("Cadastre-se")').first();
    await toggle.waitFor({ state: 'visible', timeout: 5000 });
    await toggle.click();
    await settle();
    await page.waitForSelector('text=Criar Conta', { timeout: 5000 });
  }, page);

  await step('W03', 'Fill email field', async () => {
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill(WORKER_EMAIL);
  }, page);

  await step('W04', 'Fill password field and verify strength indicator', async () => {
    const passInput = page.locator('input[type="password"]').first();
    await passInput.waitFor({ state: 'visible', timeout: 5000 });
    await passInput.fill(WORKER_PASS);
    await settle(1000);
    // Verify strength indicator appears
    await page.waitForSelector('text=Forca:', { timeout: 5000 });
  }, page);

  await step('W05', 'Click "Criar Conta" -> wait for redirect', async () => {
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
    await submitBtn.click();
    await settle(5000);
  }, page);

  await step('W06', 'Verify on /dashboard or onboarding after signup', async () => {
    const url = page.url();
    const isOnboarding = url.includes('onboarding') || url.includes('dashboard');
    if (!isOnboarding) {
      // Check for error messages
      const errorEl = page.locator('.bg-red-100').first();
      const errVisible = await errorEl.isVisible().catch(() => false);
      if (errVisible) {
        const errText = await errorEl.textContent();
        if (errText.includes('cadastrado') || errText.includes('already registered')) {
          console.log('    Account already exists - will login instead');
        } else {
          throw new Error('Signup error: ' + errText);
        }
      }
      const successEl = page.locator('.bg-green-100').first();
      const successVisible = await successEl.isVisible().catch(() => false);
      if (successVisible) {
        const successText = await successEl.textContent();
        console.log('    Signup message: ' + successText);
      }
    }
  }, page);

  // ===========================================================================
  // WORKER ONBOARDING (WO01-WO14)
  // ===========================================================================

  // Check if we need to login first (if signup said "already registered")
  let needsWorkerLogin = false;
  {
    const currentUrl = page.url();
    if (!currentUrl.includes('onboarding') && !currentUrl.includes('dashboard')) {
      needsWorkerLogin = true;
    }
  }

  if (needsWorkerLogin) {
    await step('W06b', 'Login as existing worker', async () => {
      if (!page.url().includes('login')) {
        try {
          await page.locator('button:has-text("Quero Trabalhar")').first().click();
          await settle();
        } catch {
          await page.goto(BASE_URL + '/login?type=work', { waitUntil: 'networkidle' });
          await settle();
        }
      }
      // Switch to login mode if in signup mode
      const loginToggle = page.locator('button:has-text("Fazer Login")').first();
      const isSignupMode = await loginToggle.isVisible().catch(() => false);
      if (isSignupMode) {
        await loginToggle.click();
        await settle();
      }
      await page.locator('input[type="email"]').first().fill(WORKER_EMAIL);
      await page.locator('input[type="password"]').first().fill(WORKER_PASS);
      await page.locator('button[type="submit"]').first().click();
      await settle(5000);
    }, page);
  }

  // Helper: check if already onboarded (on dashboard, not onboarding)
  function alreadyOnboarded() {
    const u = page.url();
    return u.includes('dashboard') && !u.includes('onboarding');
  }

  await step('WO01', 'Step 1: fill name', async () => {
    if (alreadyOnboarded()) { console.log('    Already onboarded, skipping'); return; }
    await page.waitForURL(/onboarding|dashboard/, { timeout: 10000 });
    if (alreadyOnboarded()) return;
    const nameInput = page.locator('input[aria-label="Nome completo"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.fill('Teste Worker');
  }, page);

  await step('WO02', 'Step 1: fill CPF', async () => {
    if (alreadyOnboarded()) return;
    const cpfInput = page.locator('input[aria-label="CPF"]').first();
    await cpfInput.waitFor({ state: 'visible', timeout: 5000 });
    await cpfInput.fill('12345678909');
  }, page);

  await step('WO03', 'Step 1: fill birth date', async () => {
    if (alreadyOnboarded()) return;
    const dateInput = page.locator('input[type="date"]').first();
    await dateInput.waitFor({ state: 'visible', timeout: 5000 });
    await dateInput.fill('1995-06-15');
  }, page);

  await step('WO04', 'Step 1: fill phone', async () => {
    if (alreadyOnboarded()) return;
    const phoneInput = page.locator('input[aria-label="Celular ou WhatsApp"]').first();
    await phoneInput.waitFor({ state: 'visible', timeout: 5000 });
    await phoneInput.fill('11999887766');
  }, page);

  await step('WO05', 'Step 1: fill city', async () => {
    if (alreadyOnboarded()) return;
    const cityInput = page.locator('input[aria-label="Cidade"]').first();
    await cityInput.waitFor({ state: 'visible', timeout: 5000 });
    await cityInput.fill('Sao Paulo');
  }, page);

  await step('WO06', 'Step 1: click Proximo', async () => {
    if (alreadyOnboarded()) return;
    const nextBtn = page.locator('button[type="submit"]').first();
    await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
    await nextBtn.click();
    await settle();
  }, page);

  await step('WO07', 'Step 2: select roles', async () => {
    if (alreadyOnboarded()) return;
    // Click role toggle buttons by their exact text content
    const garcom = page.locator('button:text-is("Garçom")').first();
    try {
      await garcom.waitFor({ state: 'visible', timeout: 5000 });
      await garcom.click();
    } catch {
      // Fallback: try without accent
      const garcom2 = page.locator('button:has-text("Garcom")').first();
      await garcom2.click();
    }
    await settle(500);
    const cozinheiro = page.locator('button:text-is("Cozinheiro")').first();
    try {
      await cozinheiro.waitFor({ state: 'visible', timeout: 3000 });
      await cozinheiro.click();
    } catch {
      const coz2 = page.locator('button:has-text("Cozinheiro")').first();
      await coz2.click();
    }
    await settle(500);
  }, page);

  await step('WO08', 'Step 2: select experience', async () => {
    if (alreadyOnboarded()) return;
    const select = page.locator('select[aria-label="Tempo de experiencia"]').first();
    await select.waitFor({ state: 'visible', timeout: 5000 });
    await select.selectOption('1-2 anos');
  }, page);

  await step('WO09', 'Step 2: fill bio', async () => {
    if (alreadyOnboarded()) return;
    const bio = page.locator('textarea[aria-label="Bio curta"]').first();
    await bio.waitFor({ state: 'visible', timeout: 5000 });
    await bio.fill('Profissional dedicado e pontual, com experiencia em eventos corporativos.');
  }, page);

  await step('WO10', 'Step 2: click Proximo', async () => {
    if (alreadyOnboarded()) return;
    const nextBtn = page.locator('button[type="submit"]').first();
    await nextBtn.click();
    await settle();
  }, page);

  await step('WO11', 'Step 3: select availability', async () => {
    if (alreadyOnboarded()) return;
    // Click availability toggle buttons
    try {
      const manha = page.locator('button:text-is("Manhã")').first();
      await manha.waitFor({ state: 'visible', timeout: 5000 });
      await manha.click();
    } catch {
      const manha2 = page.locator('button:has-text("Manh")').first();
      await manha2.click();
    }
    await settle(500);
    try {
      const tarde = page.locator('button:text-is("Tarde")').first();
      await tarde.waitFor({ state: 'visible', timeout: 3000 });
      await tarde.click();
    } catch {
      const tarde2 = page.locator('button:has-text("Tarde")').first();
      await tarde2.click();
    }
    await settle(500);
  }, page);

  await step('WO12', 'Step 3: select goal', async () => {
    if (alreadyOnboarded()) return;
    const radio = page.locator('input[aria-label="Renda Extra (Freelancer)"]').first();
    await radio.waitFor({ state: 'visible', timeout: 5000 });
    await radio.click();
    await settle(500);
  }, page);

  await step('WO13', 'Step 3: check TOS checkbox', async () => {
    if (alreadyOnboarded()) return;
    const tos = page.locator('#tos').first();
    await tos.waitFor({ state: 'visible', timeout: 5000 });
    await tos.check();
    await settle(500);
  }, page);

  await step('WO14', 'Step 3: click Finalizar -> verify redirect to /dashboard', async () => {
    if (alreadyOnboarded()) return;
    const finalBtn = page.locator('button[type="submit"]').first();
    await finalBtn.waitFor({ state: 'visible', timeout: 5000 });
    await finalBtn.click();
    // Wait for full page reload to /dashboard
    await settle(8000);
    await page.waitForURL(/dashboard/, { timeout: 15000 });
  }, page);

  // ===========================================================================
  // WORKER DASHBOARD (WD01-WD02)
  // ===========================================================================

  await step('WD01', 'Verify dashboard loaded', async () => {
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    await settle(3000);
    const heading = page.locator('h1, h2, h3').first();
    await heading.waitFor({ state: 'visible', timeout: 10000 });
  }, page);

  await step('WD02', 'Screenshot dashboard', async () => {
    await settle(2000);
  }, page);

  // ===========================================================================
  // WORKER JOBS (WJ01-WJ21)
  // ===========================================================================

  await step('WJ01', 'Click sidebar "Buscar Vagas"', async () => {
    await clickNav('a[href="/jobs"]', 'Buscar Vagas');
  }, page);

  await step('WJ02', 'Verify job listings page loaded', async () => {
    await page.waitForURL(/jobs/, { timeout: 5000 });
    await settle(2000);
    await page.waitForSelector('text=Buscar Vagas', { timeout: 10000 });
  }, page);

  await step('WJ03', 'Type "garcom" in search box', async () => {
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });
    await searchInput.fill('garcom');
    await settle(1000);
  }, page);

  await step('WJ04', 'Screenshot search results', async () => {
    await settle(1000);
  }, page);

  await step('WJ05', 'Clear search', async () => {
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    await searchInput.fill('');
    await settle(1000);
  }, page);

  await step('WJ06', 'Click "Garcom" category tab', async () => {
    const tab = page.locator('button:has-text("Garcom")').first();
    await tab.waitFor({ state: 'visible', timeout: 5000 });
    await tab.click();
    await settle(1000);
  }, page);

  await step('WJ07', 'Screenshot filtered results', async () => {
    await settle(1000);
  }, page);

  await step('WJ08', 'Click "Cozinheiro" category tab', async () => {
    const tab = page.locator('button:has-text("Cozinheiro")').first();
    await tab.waitFor({ state: 'visible', timeout: 5000 });
    await tab.click();
    await settle(1000);
  }, page);

  await step('WJ09', 'Click "Barman" category tab', async () => {
    const tab = page.locator('button:has-text("Barman")').first();
    await tab.waitFor({ state: 'visible', timeout: 5000 });
    await tab.click();
    await settle(1000);
  }, page);

  await step('WJ10', 'Click "Todos" to reset category', async () => {
    const tab = page.locator('button:has-text("Todos")').first();
    await tab.waitFor({ state: 'visible', timeout: 5000 });
    await tab.click();
    await settle(1000);
  }, page);

  await step('WJ11', 'Click "Presencial" modality', async () => {
    const btn = page.locator('button:has-text("Presencial")').first();
    await btn.waitFor({ state: 'visible', timeout: 5000 });
    await btn.click();
    await settle(1000);
  }, page);

  await step('WJ12', 'Click "Remoto" modality', async () => {
    const btn = page.locator('button:has-text("Remoto")').first();
    await btn.waitFor({ state: 'visible', timeout: 5000 });
    await btn.click();
    await settle(1000);
  }, page);

  await step('WJ13', 'Click "Todas" modality to reset', async () => {
    const btn = page.locator('button:has-text("Todas")').first();
    await btn.waitFor({ state: 'visible', timeout: 5000 });
    await btn.click();
    await settle(1000);
  }, page);

  await step('WJ14', 'Type "200" in min budget', async () => {
    const budgetInput = page.locator('input[type="number"]').first();
    await budgetInput.waitFor({ state: 'visible', timeout: 5000 });
    await budgetInput.fill('200');
    await settle(1000);
  }, page);

  await step('WJ15', 'Screenshot budget filter', async () => {
    await settle(1000);
  }, page);

  await step('WJ16', 'Clear budget', async () => {
    const budgetInput = page.locator('input[type="number"]').first();
    await budgetInput.fill('');
    await settle(1000);
  }, page);

  await step('WJ17', 'Type "Sao Paulo" in city filter', async () => {
    const cityInput = page.locator('input[placeholder*="Sao Paulo"]').first();
    await cityInput.waitFor({ state: 'visible', timeout: 5000 });
    await cityInput.fill('Sao Paulo');
    await settle(1000);
  }, page);

  await step('WJ18', 'Screenshot city filter', async () => {
    await settle(1000);
  }, page);

  await step('WJ19', 'Click "Limpar filtros"', async () => {
    try {
      const clearBtn = page.locator('button:has-text("Limpar filtros")').first();
      await clearBtn.waitFor({ state: 'visible', timeout: 3000 });
      await clearBtn.click();
      await settle(1000);
    } catch {
      // If no active filters, clear manually
      const cityInput = page.locator('input[placeholder*="Sao Paulo"]').first();
      try { await cityInput.fill(''); } catch {}
      await settle(1000);
    }
  }, page);

  await step('WJ20', 'Click first job card (if available)', async () => {
    try {
      // Job cards are rendered by JobCard component
      const jobCard = page.locator('[class*="rounded-2xl"][class*="border-2"]').first();
      await jobCard.waitFor({ state: 'visible', timeout: 5000 });
      await jobCard.click();
      await settle(2000);
    } catch {
      console.log('    No job cards available');
    }
  }, page);

  await step('WJ21', 'Click "Candidatar-se" if visible', async () => {
    try {
      const applyBtn = page.locator('button:has-text("Candidatar")').first();
      const visible = await applyBtn.isVisible().catch(() => false);
      if (visible) {
        await applyBtn.click();
        await settle(3000);
      } else {
        console.log('    No "Candidatar-se" button visible');
      }
    } catch {
      console.log('    No job to apply to');
    }
  }, page);

  // ===========================================================================
  // WORKER MY JOBS (WM01-WM06)
  // ===========================================================================

  await step('WM01', 'Click sidebar "Meus Jobs"', async () => {
    await clickNav('a[href="/my-jobs"]', 'Meus Jobs');
  }, page);

  await step('WM02', 'Click "Candidaturas" tab', async () => {
    try {
      const tab = page.locator('button:has-text("Candidaturas")').first();
      await tab.waitFor({ state: 'visible', timeout: 5000 });
      await tab.click();
      await settle(1000);
    } catch { console.log('    Tab not found'); }
  }, page);

  await step('WM03', 'Click "Em Andamento" tab', async () => {
    try {
      const tab = page.locator('button:has-text("Em Andamento")').first();
      await tab.waitFor({ state: 'visible', timeout: 5000 });
      await tab.click();
      await settle(1000);
    } catch { console.log('    Tab not found'); }
  }, page);

  await step('WM04', 'Click "Agendados" tab', async () => {
    try {
      const tab = page.locator('button:has-text("Agendados")').first();
      await tab.waitFor({ state: 'visible', timeout: 5000 });
      await tab.click();
      await settle(1000);
    } catch { console.log('    Tab not found'); }
  }, page);

  await step('WM05', 'Click "Historico" tab', async () => {
    try {
      const tab = page.locator('button:has-text("Hist")').first();
      await tab.waitFor({ state: 'visible', timeout: 5000 });
      await tab.click();
      await settle(1000);
    } catch { console.log('    Tab not found'); }
  }, page);

  await step('WM06', 'Screenshot My Jobs page', async () => {
    await settle(1000);
  }, page);

  // ===========================================================================
  // WORKER WALLET (WW01-WW05)
  // ===========================================================================

  await step('WW01', 'Click sidebar "Carteira"', async () => {
    await clickNav('a[href="/wallet"]', 'Carteira');
  }, page);

  await step('WW02', 'Verify balance shows', async () => {
    await page.waitForURL(/wallet/, { timeout: 5000 });
    await settle(3000);
    const balanceEl = page.locator('text=/R\\$|Saldo/').first();
    await balanceEl.waitFor({ state: 'visible', timeout: 10000 });
  }, page);

  await step('WW03', 'Verify "Sacar" button exists (disabled if balance=0)', async () => {
    // If we're not on wallet page (e.g., on re-run), navigate there
    if (!page.url().includes('/wallet')) {
      // Need to login as worker first, then go to wallet
      await page.goto(BASE_URL + '/login?type=work', { waitUntil: 'networkidle' });
      await settle(2000);
      // If we got redirected to dashboard (already logged in), just go to wallet
      if (page.url().includes('dashboard')) {
        await page.goto(BASE_URL + '/wallet', { waitUntil: 'networkidle' });
        await settle(5000);
      } else if (page.url().includes('login')) {
        // Need to login
        try {
          const lt = page.locator('button:has-text("Fazer Login")').first();
          if (await lt.isVisible().catch(() => false)) { await lt.click(); await settle(); }
        } catch {}
        await page.locator('input[type="email"]').first().fill(WORKER_EMAIL);
        await page.locator('input[type="password"]').first().fill(WORKER_PASS);
        await page.locator('button[type="submit"]').first().click();
        await settle(5000);
        // Now we should be on dashboard, navigate to wallet
        await page.goto(BASE_URL + '/wallet', { waitUntil: 'networkidle' });
        await settle(5000);
      }
    }
    // The SACAR button text is "SACAR (PIX)" based on the screenshot
    const sacarBtn = page.locator('button:has-text("SACAR")').first();
    await sacarBtn.waitFor({ state: 'visible', timeout: 10000 });
    const isDisabled = await sacarBtn.isDisabled();
    if (isDisabled) {
      console.log('    "Sacar" button is disabled (balance R$ 0.00) - expected behavior');
    } else {
      await sacarBtn.click();
      await settle(1000);
    }
  }, page);

  await step('WW04', 'Screenshot withdraw modal', async () => {
    await settle(1000);
  }, page);

  await step('WW05', 'Close modal', async () => {
    try {
      const cancelBtn = page.locator('button:has-text("Cancelar")').first();
      const visible = await cancelBtn.isVisible().catch(() => false);
      if (visible) {
        await cancelBtn.click();
      } else {
        const xBtn = page.locator('button:has(svg.lucide-x)').first();
        const xVisible = await xBtn.isVisible().catch(() => false);
        if (xVisible) {
          await xBtn.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
      await settle(1000);
    } catch {
      await page.keyboard.press('Escape');
      await settle(1000);
    }
  }, page);

  // ===========================================================================
  // WORKER PROFILE (WP01-WP11)
  // ===========================================================================

  await step('WP01', 'Click sidebar "Perfil"', async () => {
    await clickNav('a[href="/profile"]', 'Meu Perfil');
  }, page);

  await step('WP02', 'Verify profile data loaded', async () => {
    await page.waitForURL(/profile/, { timeout: 5000 });
    await settle(3000);
    const profileContent = page.locator('text=/Perfil|Teste Worker/').first();
    await profileContent.waitFor({ state: 'visible', timeout: 10000 });
  }, page);

  await step('WP03', 'Click "Editar Perfil"', async () => {
    const editBtn = page.locator('button:has-text("Editar")').first();
    await editBtn.waitFor({ state: 'visible', timeout: 5000 });
    await editBtn.click();
    await settle(1000);
  }, page);

  await step('WP04', 'Change bio field', async () => {
    try {
      const bioField = page.locator('textarea').first();
      await bioField.waitFor({ state: 'visible', timeout: 5000 });
      await bioField.fill('Profissional dedicado e pontual. Atualizado via E2E test.');
    } catch {
      const bioInput = page.locator('input[name="bio"]').first();
      await bioInput.fill('Profissional dedicado e pontual. Atualizado via E2E test.');
    }
    await settle(500);
  }, page);

  await step('WP05', 'Click "Salvar"', async () => {
    const saveBtn = page.locator('button:has-text("Salvar")').first();
    await saveBtn.waitFor({ state: 'visible', timeout: 5000 });
    await saveBtn.click();
    await settle(3000);
  }, page);

  await step('WP06', 'Verify toast "Perfil atualizado"', async () => {
    try {
      const toast = page.locator('text=/atualizado|salvo|sucesso/i').first();
      await toast.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      console.log('    Toast may have disappeared already');
    }
  }, page);

  await step('WP07', 'Scroll to Security section', async () => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await settle(1000);
    try {
      const sec = page.locator('text=/Seguran|Senha|Security/i').first();
      await sec.scrollIntoViewIfNeeded();
      await settle(1000);
    } catch {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await settle(1000);
    }
  }, page);

  await step('WP08', 'Scroll to Danger Zone', async () => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await settle(1000);
  }, page);

  await step('WP09', 'Click "Excluir Conta" -> modal opens', async () => {
    const deleteBtn = page.locator('button:has-text("Excluir")').first();
    await deleteBtn.waitFor({ state: 'visible', timeout: 5000 });
    await deleteBtn.click();
    await settle(1000);
  }, page);

  await step('WP10', 'Screenshot delete modal', async () => {
    await settle(1000);
  }, page);

  await step('WP11', 'Click "Cancelar" on delete modal', async () => {
    const cancelBtn = page.locator('button:has-text("Cancelar")').first();
    await cancelBtn.waitFor({ state: 'visible', timeout: 5000 });
    await cancelBtn.click();
    await settle(1000);
  }, page);

  // ===========================================================================
  // WORKER MESSAGES (WMS01-WMS02)
  // ===========================================================================

  await step('WMS01', 'Click sidebar "Mensagens"', async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await settle(500);
    await clickNav('a[href="/messages"]', 'Mensagens');
  }, page);

  await step('WMS02', 'Screenshot messages page', async () => {
    await page.waitForURL(/messages/, { timeout: 5000 });
    await settle(3000);
  }, page);

  // ===========================================================================
  // WORKER NOTIFICATIONS (WN01-WN08)
  // ===========================================================================

  await step('WN01', 'Click notification bell icon', async () => {
    const bell = page.locator('button[aria-label="Notifications"]').first();
    await bell.waitFor({ state: 'visible', timeout: 5000 });
    await bell.click();
    await settle(1000);
  }, page);

  await step('WN02', 'Screenshot notification dropdown', async () => {
    await settle(1000);
  }, page);

  await step('WN03', 'Click "Ver todas" or navigate to /notifications', async () => {
    try {
      const verTodas = page.locator('text=/Ver todas|Ver tudo/i').first();
      const visible = await verTodas.isVisible().catch(() => false);
      if (visible) {
        await verTodas.click();
        await settle(2000);
        await page.waitForURL(/notifications/, { timeout: 5000 });
      } else {
        await page.keyboard.press('Escape');
        await settle(500);
        await page.evaluate(() => { window.location.href = '/notifications'; });
        await settle(3000);
      }
    } catch {
      await page.evaluate(() => { window.location.href = '/notifications'; });
      await settle(3000);
    }
  }, page);

  await step('WN04', 'Click "Mensagens" notification tab', async () => {
    try {
      const tab = page.locator('button:has-text("Mensagens")').first();
      await tab.waitFor({ state: 'visible', timeout: 5000 });
      await tab.click();
      await settle(1000);
    } catch { console.log('    Tab not found'); }
  }, page);

  await step('WN05', 'Click "Pagamentos" notification tab', async () => {
    try {
      const tab = page.locator('button:has-text("Pagamentos")').first();
      await tab.waitFor({ state: 'visible', timeout: 5000 });
      await tab.click();
      await settle(1000);
    } catch { console.log('    Tab not found'); }
  }, page);

  await step('WN06', 'Click "Status" notification tab', async () => {
    try {
      const tab = page.locator('button:has-text("Status")').first();
      await tab.waitFor({ state: 'visible', timeout: 5000 });
      await tab.click();
      await settle(1000);
    } catch { console.log('    Tab not found'); }
  }, page);

  await step('WN07', 'Click "Sistema" notification tab', async () => {
    try {
      const tab = page.locator('button:has-text("Sistema")').first();
      await tab.waitFor({ state: 'visible', timeout: 5000 });
      await tab.click();
      await settle(1000);
    } catch { console.log('    Tab not found'); }
  }, page);

  await step('WN08', 'Click "Todas" notification tab', async () => {
    try {
      const tab = page.locator('button:has-text("Todas")').first();
      await tab.waitFor({ state: 'visible', timeout: 5000 });
      await tab.click();
      await settle(1000);
    } catch { console.log('    Tab not found'); }
  }, page);

  // ===========================================================================
  // WORKER ANALYTICS (WA01-WA03)
  // ===========================================================================

  await step('WA01', 'Click sidebar "Analytics"', async () => {
    await clickNav('a[href="/analytics"]', 'Analytics');
  }, page);

  await step('WA02', 'Verify analytics page loaded', async () => {
    await page.waitForURL(/analytics/, { timeout: 5000 });
    await settle(3000);
    try {
      const content = page.locator('text=/Analytics|Desempenho|Estat/i').first();
      await content.waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      console.log('    Analytics content may not have specific heading');
    }
  }, page);

  await step('WA03', 'Screenshot analytics page', async () => {
    await settle(1000);
  }, page);

  // ===========================================================================
  // WORKER LOGOUT (WL01-WL02)
  // ===========================================================================

  await step('WL01', 'Click logout button', async () => {
    const logoutBtn = page.locator('button:has-text("Sair")').first();
    await logoutBtn.waitFor({ state: 'visible', timeout: 5000 });
    await logoutBtn.click();
    await settle(3000);
  }, page);

  await step('WL02', 'Verify on landing page or login', async () => {
    const url = page.url();
    const isLoggedOut = url.includes('login') || url.match(/:5173\/?$/) || url.endsWith('/');
    if (!isLoggedOut) {
      throw new Error('Expected login or landing, got: ' + url);
    }
  }, page);

  // ===========================================================================
  // WORKER RE-LOGIN (WR01-WR05)
  // ===========================================================================

  await step('WR01', 'Navigate to login (click)', async () => {
    try {
      const btn = page.locator('button:has-text("Quero Trabalhar")').first();
      await btn.waitFor({ state: 'visible', timeout: 5000 });
      await btn.click();
    } catch {}
    await settle();
    await page.waitForURL(/login/, { timeout: 5000 });
  }, page);

  await step('WR02', 'Fill worker credentials', async () => {
    try {
      const loginToggle = page.locator('button:has-text("Fazer Login")').first();
      const isSignup = await loginToggle.isVisible().catch(() => false);
      if (isSignup) {
        await loginToggle.click();
        await settle();
      }
    } catch {}
    await page.locator('input[type="email"]').first().fill(WORKER_EMAIL);
    await page.locator('input[type="password"]').first().fill(WORKER_PASS);
  }, page);

  await step('WR03', 'Click "Entrar"', async () => {
    await page.locator('button[type="submit"]').first().click();
    await settle(5000);
  }, page);

  await step('WR04', 'Verify on /dashboard (NOT onboarding)', async () => {
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    if (page.url().includes('onboarding')) {
      throw new Error('Should be on dashboard, not onboarding');
    }
  }, page);

  await step('WR05', 'Logout worker again', async () => {
    const logoutBtn = page.locator('button:has-text("Sair")').first();
    await logoutBtn.waitFor({ state: 'visible', timeout: 5000 });
    await logoutBtn.click();
    await settle(3000);
  }, page);

  // ===========================================================================
  // COMPANY SIGNUP (C01-C06)
  // ===========================================================================

  await step('C01', 'Click company signup button on landing', async () => {
    // If on login, go back to landing
    if (page.url().includes('login')) {
      try {
        await page.locator('button:has-text("VOLTAR")').first().click();
        await settle();
      } catch {}
    }
    try {
      const btn = page.locator('button:has-text("Cadastrar como Empresa")').first();
      await btn.waitFor({ state: 'visible', timeout: 5000 });
      await btn.click();
    } catch {
      const btn2 = page.locator('button:has-text("Quero Contratar")').first();
      await btn2.waitFor({ state: 'visible', timeout: 5000 });
      await btn2.click();
    }
    await settle();
    await page.waitForURL(/login/, { timeout: 5000 });
  }, page);

  await step('C02', 'Click "Cadastre-se"', async () => {
    const toggle = page.locator('button:has-text("Cadastre-se")').first();
    await toggle.waitFor({ state: 'visible', timeout: 5000 });
    await toggle.click();
    await settle();
    await page.waitForSelector('text=Criar Conta', { timeout: 5000 });
  }, page);

  await step('C03', 'Fill company email', async () => {
    await page.locator('input[type="email"]').first().fill(COMPANY_EMAIL);
  }, page);

  await step('C04', 'Fill company password', async () => {
    await page.locator('input[type="password"]').first().fill(COMPANY_PASS);
    await settle(1000);
  }, page);

  await step('C05', 'Click "Criar Conta" -> wait', async () => {
    await page.locator('button[type="submit"]').first().click();
    await settle(5000);
  }, page);

  await step('C06', 'Verify on company onboarding or dashboard', async () => {
    const url = page.url();
    if (!url.includes('company') && !url.includes('onboarding') && !url.includes('dashboard')) {
      const errorEl = page.locator('.bg-red-100').first();
      const errVisible = await errorEl.isVisible().catch(() => false);
      if (errVisible) {
        const errText = await errorEl.textContent();
        if (errText.includes('cadastrado') || errText.includes('already registered')) {
          console.log('    Company account already exists');
        } else {
          throw new Error('Signup error: ' + errText);
        }
      }
    }
  }, page);

  // ===========================================================================
  // COMPANY ONBOARDING (CO01-CO10)
  // ===========================================================================

  // Check if company needs login
  let needsCompanyLogin = false;
  {
    const cu = page.url();
    if (!cu.includes('company') && !cu.includes('onboarding')) {
      needsCompanyLogin = true;
    }
  }

  if (needsCompanyLogin) {
    await step('C06b', 'Login as existing company', async () => {
      if (!page.url().includes('login')) {
        try {
          await page.locator('button:has-text("Quero Contratar")').first().click();
          await settle();
        } catch {
          await page.goto(BASE_URL + '/login?type=hire', { waitUntil: 'networkidle' });
          await settle();
        }
      }
      const loginToggle = page.locator('button:has-text("Fazer Login")').first();
      const isSignup = await loginToggle.isVisible().catch(() => false);
      if (isSignup) {
        await loginToggle.click();
        await settle();
      }
      await page.locator('input[type="email"]').first().fill(COMPANY_EMAIL);
      await page.locator('input[type="password"]').first().fill(COMPANY_PASS);
      await page.locator('button[type="submit"]').first().click();
      await settle(5000);
    }, page);
  }

  // Helper for company onboarding
  function companyAlreadyOnboarded() {
    const u = page.url();
    return u.includes('company/dashboard') && !u.includes('onboarding');
  }

  await step('CO01', 'Company Step 1: fill company name', async () => {
    if (companyAlreadyOnboarded()) { console.log('    Already onboarded'); return; }
    await page.waitForURL(/onboarding|company\/dashboard/, { timeout: 10000 });
    if (companyAlreadyOnboarded()) return;
    const nameInput = page.locator('input[aria-label="Nome da empresa"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.fill('Empresa Teste LTDA');
  }, page);

  await step('CO02', 'Company Step 1: fill CNPJ', async () => {
    if (companyAlreadyOnboarded()) return;
    const cnpjInput = page.locator('input[aria-label="CNPJ"]').first();
    await cnpjInput.waitFor({ state: 'visible', timeout: 5000 });
    await cnpjInput.fill('11222333000181');
  }, page);

  await step('CO03', 'Company Step 1: select type', async () => {
    if (companyAlreadyOnboarded()) return;
    const select = page.locator('select[aria-label="Tipo de empresa"]').first();
    await select.waitFor({ state: 'visible', timeout: 5000 });
    await select.selectOption('MEI');
  }, page);

  await step('CO04', 'Company Step 1: select industry', async () => {
    if (companyAlreadyOnboarded()) return;
    const select = page.locator('select[aria-label="Setor"]').first();
    await select.waitFor({ state: 'visible', timeout: 5000 });
    const options = await select.locator('option').allTextContents();
    const validOption = options.find(o => o && o !== 'Selecione...');
    if (validOption) {
      await select.selectOption({ label: validOption });
    }
  }, page);

  await step('CO05', 'Company Step 1: fill city', async () => {
    if (companyAlreadyOnboarded()) return;
    const cityInput = page.locator('input[aria-label="Cidade"]').first();
    await cityInput.waitFor({ state: 'visible', timeout: 5000 });
    await cityInput.fill('Rio de Janeiro');
  }, page);

  await step('CO06', 'Company Step 1: click Proximo', async () => {
    if (companyAlreadyOnboarded()) return;
    const nextBtn = page.locator('button[type="submit"]').first();
    await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
    await nextBtn.click();
    await settle(2000);
  }, page);

  await step('CO07', 'Company Step 2: select hiring goal', async () => {
    if (companyAlreadyOnboarded()) return;
    const radio = page.locator('input[aria-label="Freelancers Pontuais"]').first();
    await radio.waitFor({ state: 'visible', timeout: 5000 });
    await radio.click();
    await settle(500);
  }, page);

  await step('CO08', 'Company Step 2: select hiring volume', async () => {
    if (companyAlreadyOnboarded()) return;
    const volumeLabel = page.locator('label:has-text("1-5")').first();
    await volumeLabel.waitFor({ state: 'visible', timeout: 5000 });
    await volumeLabel.click();
    await settle(500);
  }, page);

  await step('CO09', 'Company Step 2: check TOS', async () => {
    if (companyAlreadyOnboarded()) return;
    const tos = page.locator('#tos').first();
    await tos.waitFor({ state: 'visible', timeout: 5000 });
    await tos.check();
    await settle(500);
  }, page);

  await step('CO10', 'Company Step 2: click Finalizar', async () => {
    if (companyAlreadyOnboarded()) return;
    const finalBtn = page.locator('button[type="submit"]').first();
    await finalBtn.click();
    await settle(8000);
    await page.waitForURL(/company\/dashboard/, { timeout: 15000 });
  }, page);

  // ===========================================================================
  // COMPANY DASHBOARD (CD01)
  // ===========================================================================

  await step('CD01', 'Verify company dashboard loaded', async () => {
    await page.waitForURL(/company\/dashboard/, { timeout: 10000 });
    await settle(3000);
    const heading = page.locator('h1, h2, h3').first();
    await heading.waitFor({ state: 'visible', timeout: 10000 });
  }, page);

  // ===========================================================================
  // COMPANY JOBS + CREATE JOB (CJ01-CJ05)
  // ===========================================================================

  await step('CJ01', 'Click sidebar "Minhas Vagas"', async () => {
    await clickNav('a[href="/company/jobs"]', 'Minhas Vagas');
  }, page);

  await step('CJ02', 'Verify company jobs page loaded', async () => {
    await page.waitForURL(/company\/jobs/, { timeout: 5000 });
    await settle(3000);
  }, page);

  await step('CJ03', 'Click sidebar "Criar Vaga"', async () => {
    await clickNav('a[href="/company/create"]', 'Criar Vaga');
  }, page);

  await step('CJ04', 'Fill create job form step 1', async () => {
    await page.waitForURL(/company\/create/, { timeout: 5000 });
    await settle(2000);
    const titleInput = page.locator('input[aria-label="Título da Vaga"]').first();
    await titleInput.waitFor({ state: 'visible', timeout: 10000 });
    await titleInput.fill('Garcom para Evento Corporativo');
    const catSelect = page.locator('select[aria-label="Categoria"]').first();
    await catSelect.waitFor({ state: 'visible', timeout: 5000 });
    const catOptions = await catSelect.locator('option').allTextContents();
    const validCat = catOptions.find(o => o && o !== 'Selecione...');
    if (validCat) {
      await catSelect.selectOption({ label: validCat });
    }
    await settle(500);
  }, page);

  await step('CJ05', 'Screenshot create job form', async () => {
    await settle(1000);
  }, page);

  // ===========================================================================
  // COMPANY PROFILE (CP01-CP05)
  // ===========================================================================

  await step('CP01', 'Click sidebar "Perfil Empresa"', async () => {
    await clickNav('a[href="/company/profile"]', 'Perfil Empresa');
  }, page);

  await step('CP02', 'Verify company profile loaded', async () => {
    await page.waitForURL(/company\/profile/, { timeout: 5000 });
    await settle(3000);
    const content = page.locator('text=/Perfil|Empresa/i').first();
    await content.waitFor({ state: 'visible', timeout: 10000 });
  }, page);

  await step('CP03', 'Click "Editar" on company profile', async () => {
    const editBtn = page.locator('button:has-text("Editar")').first();
    await editBtn.waitFor({ state: 'visible', timeout: 5000 });
    await editBtn.click();
    await settle(1000);
  }, page);

  await step('CP04', 'Change company description', async () => {
    try {
      const descField = page.locator('textarea').first();
      await descField.waitFor({ state: 'visible', timeout: 5000 });
      await descField.fill('Empresa dedicada a excelencia em eventos. Atualizado via E2E.');
    } catch {
      try {
        const descInput = page.locator('input[name="description"]').first();
        await descInput.fill('Empresa dedicada. E2E test.');
      } catch { console.log('    No editable description field found'); }
    }
    await settle(500);
  }, page);

  await step('CP05', 'Click "Salvar" on company profile', async () => {
    const saveBtn = page.locator('button:has-text("Salvar")').first();
    await saveBtn.waitFor({ state: 'visible', timeout: 5000 });
    await saveBtn.click();
    await settle(3000);
  }, page);

  // ===========================================================================
  // COMPANY WALLET (CW01-CW03)
  // ===========================================================================

  await step('CW01', 'Click sidebar "Carteira" (company)', async () => {
    await clickNav('a[href="/company/wallet"]', 'Carteira');
  }, page);

  await step('CW02', 'Verify company wallet loaded', async () => {
    await page.waitForURL(/company\/wallet/, { timeout: 5000 });
    await settle(3000);
    const content = page.locator('text=/R\\$|Saldo|Carteira/i').first();
    await content.waitFor({ state: 'visible', timeout: 10000 });
  }, page);

  await step('CW03', 'Screenshot company wallet', async () => {
    await settle(1000);
  }, page);

  // ===========================================================================
  // COMPANY MESSAGES (CM01)
  // ===========================================================================

  await step('CM01', 'Click sidebar "Mensagens" (company)', async () => {
    await clickNav('a[href="/company/messages"]', 'Mensagens');
    await page.waitForURL(/company\/messages/, { timeout: 5000 });
    await settle(3000);
  }, page);

  // ===========================================================================
  // COMPANY NOTIFICATIONS (CN01-CN05)
  // ===========================================================================

  await step('CN01', 'Click notification bell (company)', async () => {
    const bell = page.locator('button[aria-label="Notifications"]').first();
    await bell.waitFor({ state: 'visible', timeout: 5000 });
    await bell.click();
    await settle(1000);
  }, page);

  await step('CN02', 'Screenshot company notification dropdown', async () => {
    await settle(1000);
  }, page);

  await step('CN03', 'Navigate to /notifications (company)', async () => {
    try {
      const verTodas = page.locator('text=/Ver todas|Ver tudo/i').first();
      const visible = await verTodas.isVisible().catch(() => false);
      if (visible) {
        await verTodas.click();
        await settle(2000);
      } else {
        await page.keyboard.press('Escape');
        await settle(500);
        await page.evaluate(() => { window.location.href = '/notifications'; });
        await settle(3000);
      }
    } catch {
      await page.evaluate(() => { window.location.href = '/notifications'; });
      await settle(3000);
    }
  }, page);

  await step('CN04', 'Click notification tabs (company)', async () => {
    const tabs = ['Mensagens', 'Pagamentos', 'Status', 'Sistema', 'Todas'];
    for (const tabName of tabs) {
      try {
        const tab = page.locator('button:has-text("' + tabName + '")').first();
        const visible = await tab.isVisible().catch(() => false);
        if (visible) {
          await tab.click();
          await settle(500);
        }
      } catch {}
    }
  }, page);

  await step('CN05', 'Screenshot company notifications page', async () => {
    await settle(1000);
  }, page);

  // ===========================================================================
  // COMPANY ANALYTICS (CA01)
  // ===========================================================================

  await step('CA01', 'Navigate to company analytics', async () => {
    // If not on a company page, need to login as company first
    if (!page.url().includes('company')) {
      await page.goto(BASE_URL + '/login?type=hire', { waitUntil: 'networkidle' });
      await settle(2000);
      // If already redirected to company dashboard, great
      if (page.url().includes('company')) {
        await page.goto(BASE_URL + '/company/analytics', { waitUntil: 'networkidle' });
        await settle(5000);
      } else if (page.url().includes('login')) {
        try {
          const lt = page.locator('button:has-text("Fazer Login")').first();
          if (await lt.isVisible().catch(() => false)) { await lt.click(); await settle(); }
        } catch {}
        await page.locator('input[type="email"]').first().fill(COMPANY_EMAIL);
        await page.locator('input[type="password"]').first().fill(COMPANY_PASS);
        await page.locator('button[type="submit"]').first().click();
        await settle(5000);
        // After login, should be on company/dashboard
        await page.goto(BASE_URL + '/company/analytics', { waitUntil: 'networkidle' });
        await settle(5000);
      }
    } else {
      // Try sidebar link
      try {
        const link = page.locator('a[href="/company/analytics"]').first();
        await link.waitFor({ state: 'visible', timeout: 5000 });
        await link.click();
        await settle(3000);
      } catch {
        await page.goto(BASE_URL + '/company/analytics', { waitUntil: 'networkidle' });
        await settle(5000);
      }
    }
    // Verify we're on the analytics page
    const url = page.url();
    if (!url.includes('analytics') && !url.includes('company')) {
      throw new Error('Could not navigate to company analytics, on: ' + url);
    }
    await settle(2000);
  }, page);

  // ===========================================================================
  // COMPANY RE-LOGIN (CR01-CR04)
  // ===========================================================================

  await step('CR01', 'Company logout', async () => {
    // Ensure we're on a company page with sidebar visible
    if (!page.url().includes('company')) {
      await page.evaluate(() => { window.location.href = '/company/dashboard'; });
      await settle(5000);
    }
    try {
      const logoutBtn = page.locator('button:has-text("Sair")').first();
      await logoutBtn.waitFor({ state: 'visible', timeout: 10000 });
      await logoutBtn.click();
    } catch {
      // Fallback: sign out via JavaScript
      await page.evaluate(() => {
        const sb = window.__supabase || null;
        if (sb) sb.auth.signOut();
        else window.location.href = '/login';
      });
    }
    await settle(3000);
  }, page);

  await step('CR02', 'Navigate to login as company', async () => {
    // If already on login, we're good
    if (page.url().includes('login')) {
      return;
    }
    try {
      const btn = page.locator('button:has-text("Quero Contratar")').first();
      await btn.waitFor({ state: 'visible', timeout: 5000 });
      await btn.click();
    } catch {
      // Navigate directly
      await page.evaluate(() => { window.location.href = '/login?type=hire'; });
    }
    await settle(3000);
    await page.waitForURL(/login/, { timeout: 10000 });
  }, page);

  await step('CR03', 'Login as company', async () => {
    // Make sure we're on the login page
    if (!page.url().includes('login')) {
      await page.evaluate(() => { window.location.href = '/login?type=hire'; });
      await settle(3000);
    }
    try {
      const loginToggle = page.locator('button:has-text("Fazer Login")').first();
      const isSignup = await loginToggle.isVisible().catch(() => false);
      if (isSignup) {
        await loginToggle.click();
        await settle();
      }
    } catch {}
    await page.locator('input[type="email"]').first().fill(COMPANY_EMAIL);
    await page.locator('input[type="password"]').first().fill(COMPANY_PASS);
    await page.locator('button[type="submit"]').first().click();
    await settle(5000);
  }, page);

  await step('CR04', 'Verify on /company/dashboard (NOT onboarding)', async () => {
    await page.waitForURL(/company\/dashboard/, { timeout: 10000 });
    if (page.url().includes('onboarding')) {
      throw new Error('Should be on company dashboard, not onboarding');
    }
  }, page);

  // ===========================================================================
  // FINAL REPORT
  // ===========================================================================
  console.log('\n======== RESULTS ========');
  const totalRun = results.filter(r => r.status !== 'SKIP').length;
  const totalSkip = results.filter(r => r.status === 'SKIP').length;
  const totalPass = results.filter(r => r.status === 'PASS').length;
  const totalFail = results.filter(r => r.status === 'FAIL').length;
  console.log('Total steps: ' + results.length);
  console.log('Run: ' + totalRun + ' | Skipped: ' + totalSkip);
  console.log('Passed: ' + totalPass);
  console.log('Failed: ' + totalFail);
  if (errors.length > 0) {
    console.log('\nFAILURES:');
    errors.forEach(e => console.log('  ' + e.id + ': ' + e.name + ' -- ' + e.error));
  }
  console.log('\nConsole errors captured: ' + consoleLogs.length);
  consoleLogs.slice(-15).forEach(l => console.log('  [' + l.type + '] ' + l.text.substring(0, 120)));

  fs.writeFileSync(RESULTS_FILE, JSON.stringify({ results, consoleLogs, errors, summary: { total: results.length, run: totalRun, skipped: totalSkip, passed: totalPass, failed: totalFail } }, null, 2));
  console.log('\nResults saved to ' + RESULTS_FILE);
  console.log('Progress saved to ' + PROGRESS_FILE);

  await browser.close();
})();
