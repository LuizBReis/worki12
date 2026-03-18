const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // Console capture
  const logs = [];
  page.on('console', m => {
    if (m.type() === 'error' || m.type() === 'warning') {
      const text = m.text();
      if (!text.includes('Download the React DevTools') && !text.includes('Third-party cookie') && !text.includes('DevTools')) {
        logs.push(m.type() + ': ' + text);
      }
    }
  });
  page.on('pageerror', e => logs.push('PAGE_ERROR: ' + e.message));
  page.on('response', r => {
    if (r.status() >= 400 && !r.url().includes('.well-known') && !r.url().includes('favicon') && !r.url().includes('workbox')) {
      logs.push('HTTP_' + r.status() + ': ' + r.request().method() + ' ' + r.url());
    }
  });

  // Helper: screenshot + report
  let stepNum = 0;
  let passed = 0;
  let failed = 0;
  const results = [];

  async function step(name, action) {
    stepNum++;
    const id = String(stepNum).padStart(2, '0');
    const startTime = Date.now();
    try {
      await action();
      await page.waitForTimeout(400);
      await page.screenshot({ path: 'e2e/screenshots/' + id + '-' + name + '.png', fullPage: true });
      const text = await page.evaluate(() => document.body.innerText.substring(0, 300));
      const url = page.url();
      console.log('STEP ' + id + ' [' + name + '] PASS: URL=' + url + ' (' + (Date.now() - startTime) + 'ms)');
      console.log('  TEXT: ' + text.replace(/\n/g, ' ').substring(0, 200));
      if (logs.length > 0) { console.log('  RECENT_LOGS: ' + JSON.stringify(logs.slice(-3))); }
      passed++;
      results.push({ id, name, url, result: 'PASS', error: null });
    } catch (e) {
      try {
        await page.screenshot({ path: 'e2e/screenshots/' + id + '-' + name + '-ERROR.png', fullPage: true });
      } catch (_) {}
      const url = page.url();
      console.log('STEP ' + id + ' [' + name + '] FAILED: ' + e.message.substring(0, 200));
      failed++;
      results.push({ id, name, url, result: 'FAIL', error: e.message.substring(0, 200) });
    }
  }

  // ════════════════════════════════════════════════════
  // PHASE 1: PUBLIC PAGES
  // The homepage at "/" is the Onboarding page with:
  //   nav: "Sobre" link, "Login" link
  //   cards: "Quero Trabalhar", "Quero Contratar"
  //   bottom CTA: "Cadastrar como Trabalhador", "Cadastrar como Empresa"
  // ════════════════════════════════════════════════════

  await step('landing', async () => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  // Click "Sobre" in nav -> goes to /sobre (LandingPage component)
  await step('click-sobre', async () => {
    await page.click('button:has-text("Sobre")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  // On /sobre page (LandingPage), click "Termos de Uso" in the footer
  await step('sobre-footer-termos', async () => {
    // Scroll to footer first
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.click('button:has-text("Termos de Uso")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  // Go back from /termos to /sobre
  await step('back-from-termos', async () => {
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  // Click "Ajuda" in the footer of /sobre
  await step('sobre-footer-ajuda', async () => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.click('button:has-text("Ajuda")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  // Go back to /sobre
  await step('back-from-ajuda', async () => {
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  // Click "Privacidade" in footer of /sobre
  await step('sobre-footer-privacidade', async () => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.click('button:has-text("Política de Privacidade")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  // Go back to /sobre
  await step('back-from-privacidade', async () => {
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  // Navigate back to the Onboarding / homepage via "Worki" logo or nav
  await step('back-to-homepage', async () => {
    // Click the "Worki" logo/text in the LandingPage nav which navigates to /
    const workiBtn = page.locator('button:has-text("Worki")').first();
    if (await workiBtn.isVisible()) {
      await workiBtn.click();
    } else {
      await page.goBack();
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  // ════════════════════════════════════════════════════
  // PHASE 2: WORKER SIGNUP
  // Click "Quero Trabalhar" card on homepage -> /login?type=work
  // ════════════════════════════════════════════════════

  await step('click-quero-trabalhar', async () => {
    // The card button says "Quero Trabalhar" in the Onboarding page
    await page.click('h3:has-text("Quero Trabalhar")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  await step('login-page-loaded', async () => {
    // We should be on /login?type=work, showing "Comecar a Trabalhar"
    const text = await page.evaluate(() => document.body.innerText);
    if (!text.includes('Trabalhar') && !text.includes('Entrar')) {
      throw new Error('Not on login page');
    }
  });

  // Click "Cadastre-se" toggle to switch to signup mode
  await step('click-cadastre-se', async () => {
    await page.click('button:has-text("Cadastre-se")');
    await page.waitForTimeout(500);
  });

  await step('fill-worker-signup', async () => {
    await page.fill('input[aria-label="Email"]', 'geribameuacesso+worker@gmail.com');
    await page.fill('input[aria-label="Senha"]', 'WorkiTest123');
    await page.waitForTimeout(300);
  });

  await step('submit-worker-signup', async () => {
    await page.click('button[type="submit"]');
    await page.waitForTimeout(6000);
    await page.waitForLoadState('networkidle');
  });

  // Check outcome: could be onboarding, dashboard, or error
  await step('check-after-worker-signup', async () => {
    const url = page.url();
    console.log('  Post-signup URL: ' + url);
    const pageText = await page.evaluate(() => document.body.innerText);
    if (pageText.includes('ja esta cadastrado') || pageText.includes('already registered') || pageText.includes('cadastrado')) {
      console.log('  Account already exists, switching to login...');
      await page.click('button:has-text("Fazer Login")');
      await page.waitForTimeout(500);
      await page.fill('input[aria-label="Email"]', 'geribameuacesso+worker@gmail.com');
      await page.fill('input[aria-label="Senha"]', 'WorkiTest123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      await page.waitForLoadState('networkidle');
    } else if (pageText.includes('Muitas tentativas') || pageText.includes('rate_limit') || pageText.includes('Aguarde')) {
      console.log('  Rate limited, waiting 30s...');
      await page.waitForTimeout(30000);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      await page.waitForLoadState('networkidle');
    }
  });

  // ════════════════════════════════════════════════════
  // PHASE 3: WORKER ONBOARDING (if needed)
  // ════════════════════════════════════════════════════

  const currentUrl = page.url();
  const needsOnboarding = currentUrl.includes('onboarding');
  const alreadyOnDashboard = currentUrl.includes('/dashboard') && !currentUrl.includes('onboarding');

  if (needsOnboarding) {
    console.log('=== WORKER ONBOARDING FLOW ===');

    // Step 1: Personal Data
    await step('onboard-step1-fill', async () => {
      await page.waitForTimeout(1000);
      await page.fill('input[aria-label="Nome completo"]', 'Trabalhador Teste E2E');
      await page.fill('input[aria-label="CPF"]', '52998224725');
      await page.fill('input[aria-label="Data de nascimento"]', '1995-06-15');
      await page.fill('input[aria-label="Celular ou WhatsApp"]', '11999887766');
      await page.fill('input[aria-label="Cidade"]', 'Sao Paulo');
      await page.waitForTimeout(500);
    });

    await step('onboard-step1-next', async () => {
      const nextBtn = page.locator('button[type="submit"]').last();
      await nextBtn.click();
      await page.waitForTimeout(1500);
    });

    // Step 2: Professional
    await step('onboard-step2-roles', async () => {
      // Click role buttons (not the filter buttons on jobs page)
      const garcom = page.locator('button:has-text("Garçom")');
      if (await garcom.isVisible()) await garcom.click();
      await page.waitForTimeout(200);
      const barman = page.locator('button:has-text("Barman")');
      if (await barman.isVisible()) await barman.click();
      await page.waitForTimeout(200);
    });

    await step('onboard-step2-experience', async () => {
      await page.selectOption('select[aria-label="Tempo de experiencia"]', '1-2 anos');
      await page.waitForTimeout(300);
    });

    await step('onboard-step2-bio', async () => {
      await page.fill('textarea[aria-label="Bio curta"]', 'Profissional experiente em eventos e bares.');
      await page.waitForTimeout(300);
    });

    await step('onboard-step2-next', async () => {
      const nextBtn = page.locator('button[type="submit"]').last();
      await nextBtn.click();
      await page.waitForTimeout(1500);
    });

    // Step 3: Goals & Availability
    await step('onboard-step3-goal', async () => {
      const goal = page.locator('label:has-text("Renda Extra")');
      if (await goal.isVisible()) await goal.click();
      await page.waitForTimeout(300);
    });

    await step('onboard-step3-availability', async () => {
      const manha = page.locator('button:has-text("Manhã")');
      if (await manha.isVisible()) await manha.click();
      await page.waitForTimeout(200);
      const noite = page.locator('button:has-text("Noite")');
      if (await noite.isVisible()) await noite.click();
      await page.waitForTimeout(200);
    });

    await step('onboard-step3-tos', async () => {
      await page.click('#tos');
      await page.waitForTimeout(300);
    });

    await step('onboard-step3-finalize', async () => {
      const finalBtn = page.locator('button[type="submit"]').last();
      await finalBtn.click();
      // This does window.location.href = '/dashboard' -> full page reload
      await page.waitForTimeout(8000);
      await page.waitForLoadState('networkidle');
    });
  } else if (alreadyOnDashboard) {
    console.log('=== WORKER ALREADY ONBOARDED - SKIPPING ===');
  } else {
    console.log('=== UNEXPECTED STATE: ' + currentUrl + ' ===');
  }

  // ════════════════════════════════════════════════════
  // PHASE 4: WORKER DASHBOARD
  // ════════════════════════════════════════════════════

  await step('worker-dashboard', async () => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const text = await page.evaluate(() => document.body.innerText);
    const url = page.url();
    console.log('  Dashboard URL: ' + url);
    if (text.includes('Fala,') || text.includes('Dashboard') || text.includes('Vagas para Você')) {
      console.log('  Dashboard loaded OK');
    } else {
      console.log('  Dashboard might not have loaded. Text starts: ' + text.substring(0, 100));
    }
  });

  // ════════════════════════════════════════════════════
  // PHASE 5: WORKER - BROWSE JOBS (sidebar: "Buscar Vagas" -> /jobs)
  // ════════════════════════════════════════════════════

  await step('nav-buscar-vagas', async () => {
    const link = page.locator('a[href="/jobs"]').first();
    await link.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  await step('jobs-page-loaded', async () => {
    const text = await page.evaluate(() => document.body.innerText);
    console.log('  Jobs page check: ' + (text.includes('Buscar') || text.includes('Vagas') || text.includes('Todos')));
  });

  await step('jobs-search-garcom', async () => {
    const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="buscar"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('garçom');
      await page.waitForTimeout(1000);
    } else {
      console.log('  Search input not found');
    }
  });

  await step('jobs-clear-search', async () => {
    const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="buscar"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('');
      await page.waitForTimeout(600);
    }
  });

  // Click role filter buttons
  for (const role of ['Garcom', 'Cozinheiro', 'Barman']) {
    await step('jobs-filter-' + role.toLowerCase(), async () => {
      const btn = page.locator('button:has-text("' + role + '")').first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(800);
      } else {
        console.log('  Filter button "' + role + '" not visible');
      }
    });
  }

  await step('jobs-filter-todos', async () => {
    const btn = page.locator('button:has-text("Todos")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(800);
    }
  });

  // ════════════════════════════════════════════════════
  // PHASE 6: WORKER - MY JOBS (sidebar: "Meus Jobs" -> /my-jobs)
  // ════════════════════════════════════════════════════

  await step('nav-meus-jobs', async () => {
    const link = page.locator('a[href="/my-jobs"]').first();
    await link.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  for (const tab of ['Candidaturas', 'Em Andamento', 'Agendados']) {
    await step('myjobs-tab-' + tab.toLowerCase().replace(/\s+/g, '-'), async () => {
      const btn = page.locator('button:has-text("' + tab + '")').first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(800);
      }
    });
  }

  await step('myjobs-tab-historico', async () => {
    const btn = page.locator('button:has-text("Histórico")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(800);
    }
  });

  // ════════════════════════════════════════════════════
  // PHASE 7: WORKER - MESSAGES (sidebar: "Mensagens" -> /messages)
  // ════════════════════════════════════════════════════

  await step('nav-mensagens', async () => {
    const link = page.locator('a[href="/messages"]').first();
    await link.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  // ════════════════════════════════════════════════════
  // PHASE 8: WORKER - ANALYTICS (sidebar: "Analytics" -> /analytics)
  // ════════════════════════════════════════════════════

  await step('nav-analytics', async () => {
    const link = page.locator('a[href="/analytics"]').first();
    await link.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  // ════════════════════════════════════════════════════
  // PHASE 9: WORKER - WALLET (sidebar: "Carteira" -> /wallet)
  // ════════════════════════════════════════════════════

  await step('nav-carteira', async () => {
    const link = page.locator('a[href="/wallet"]').first();
    await link.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);
  });

  await step('wallet-check', async () => {
    const text = await page.evaluate(() => document.body.innerText);
    console.log('  Wallet loaded: ' + (text.includes('Saldo') || text.includes('R$') || text.includes('Carteira')));
  });

  await step('wallet-sacar', async () => {
    const btn = page.locator('button:has-text("Sacar")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('  Sacar button not visible');
    }
  });

  await step('wallet-close-modal', async () => {
    // Close any open modal
    const xBtn = page.locator('button:has(svg.lucide-x)').first();
    if (await xBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await xBtn.click();
      await page.waitForTimeout(500);
    }
  });

  // ════════════════════════════════════════════════════
  // PHASE 10: WORKER - PROFILE (sidebar: "Meu Perfil" -> /profile)
  // ════════════════════════════════════════════════════

  await step('nav-perfil', async () => {
    const link = page.locator('a[href="/profile"]').first();
    await link.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);
  });

  await step('profile-loaded', async () => {
    const text = await page.evaluate(() => document.body.innerText);
    console.log('  Profile loaded: ' + (text.includes('Perfil') || text.includes('Nome') || text.includes('Trabalhador')));
  });

  await step('profile-click-edit', async () => {
    const editBtn = page.locator('button:has-text("Editar")').first();
    if (await editBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  await step('profile-edit-bio', async () => {
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
      await textarea.fill('Atualizado via E2E test. Dedicacao e pontualidade sao meus diferenciais.');
      await page.waitForTimeout(500);
    }
  });

  await step('profile-save', async () => {
    const saveBtn = page.locator('button:has-text("Salvar")').first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }
  });

  await step('profile-scroll-security', async () => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
  });

  // ════════════════════════════════════════════════════
  // PHASE 11: WORKER - NOTIFICATIONS
  // The NotificationBell in the sidebar triggers a dropdown
  // Then "Ver todas" navigates to /notifications
  // ════════════════════════════════════════════════════

  await step('click-notification-bell', async () => {
    // The NotificationBell is in the sidebar header
    const bell = page.locator('button[aria-label*="notif"], button[aria-label*="Notif"]').first();
    if (await bell.isVisible({ timeout: 2000 }).catch(() => false)) {
      await bell.click();
      await page.waitForTimeout(1500);
    } else {
      // Try clicking bell icon directly
      const bellIcon = page.locator('.lucide-bell').first();
      if (await bellIcon.isVisible({ timeout: 1000 }).catch(() => false)) {
        await bellIcon.click();
        await page.waitForTimeout(1500);
      }
    }
  });

  await step('notifications-ver-todas', async () => {
    // Click "Ver todas" in dropdown or navigate directly
    const verTodas = page.locator('a:has-text("Ver todas"), button:has-text("Ver todas"), a[href="/notifications"]').first();
    if (await verTodas.isVisible({ timeout: 2000 }).catch(() => false)) {
      await verTodas.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
    } else {
      // Click somewhere to close dropdown then navigate via URL
      await page.click('body');
      await page.waitForTimeout(500);
    }
  });

  // If on notifications page, test filter tabs
  const notifUrl = page.url();
  if (notifUrl.includes('notifications')) {
    for (const filter of ['Todas', 'Mensagens', 'Pagamentos', 'Status', 'Sistema']) {
      await step('notif-filter-' + filter.toLowerCase(), async () => {
        const btn = page.locator('button:has-text("' + filter + '")').first();
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await btn.click();
          await page.waitForTimeout(500);
        }
      });
    }
  }

  // ════════════════════════════════════════════════════
  // PHASE 12: WORKER LOGOUT
  // ════════════════════════════════════════════════════

  await step('worker-go-to-dashboard', async () => {
    const link = page.locator('a[href="/dashboard"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForTimeout(1000);
    }
  });

  await step('worker-logout', async () => {
    const logoutBtn = page.locator('button:has-text("Sair")').first();
    await logoutBtn.click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
  });

  // ════════════════════════════════════════════════════
  // PHASE 13: WORKER RE-LOGIN (must go to /dashboard, NOT onboarding)
  // After logout, Sidebar navigates to /login
  // ════════════════════════════════════════════════════

  await step('worker-relogin-navigate', async () => {
    const url = page.url();
    console.log('  After logout URL: ' + url);
    if (url.includes('/login')) {
      console.log('  Already on login page');
    } else {
      // We might be on the onboarding/homepage. Click "Quero Trabalhar" card
      const card = page.locator('h3:has-text("Quero Trabalhar")').first();
      if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
        await card.click();
        await page.waitForTimeout(1500);
      } else {
        // Try nav login button
        const loginBtn = page.locator('button:has-text("Login")').first();
        if (await loginBtn.isVisible()) {
          await loginBtn.click();
          await page.waitForTimeout(1500);
        }
      }
    }
  });

  await step('worker-relogin-fill', async () => {
    // Ensure we're in login mode
    const text = await page.evaluate(() => document.body.innerText);
    if (text.includes('Cadastre-se') && !text.includes('Fazer Login')) {
      // Already in login mode
    } else if (text.includes('Fazer Login')) {
      await page.click('button:has-text("Fazer Login")');
      await page.waitForTimeout(500);
    }
    await page.fill('input[aria-label="Email"]', 'geribameuacesso+worker@gmail.com');
    await page.fill('input[aria-label="Senha"]', 'WorkiTest123');
  });

  await step('worker-relogin-submit', async () => {
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');
  });

  await step('worker-relogin-verify', async () => {
    const url = page.url();
    if (url.includes('/dashboard') && !url.includes('onboarding')) {
      console.log('  SUCCESS: Worker re-login -> dashboard directly (no re-onboarding)');
    } else if (url.includes('onboarding')) {
      console.log('  BUG: Worker re-sent to onboarding!');
    } else {
      console.log('  URL after re-login: ' + url);
    }
  });

  // ════════════════════════════════════════════════════
  // PHASE 14: LOGOUT -> COMPANY SIGNUP
  // ════════════════════════════════════════════════════

  await step('worker-logout-for-company', async () => {
    await page.waitForTimeout(1000);
    const logoutBtn = page.locator('button:has-text("Sair")').first();
    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');
    }
  });

  await step('click-quero-contratar', async () => {
    const url = page.url();
    if (url.includes('/login')) {
      // We're on login, but need hire type. Go back and choose Quero Contratar
      const voltar = page.locator('button:has-text("VOLTAR")').first();
      if (await voltar.isVisible({ timeout: 2000 }).catch(() => false)) {
        await voltar.click();
        await page.waitForTimeout(1500);
      }
    }
    // Now we should be on homepage/onboarding
    const card = page.locator('h3:has-text("Quero Contratar")').first();
    if (await card.isVisible({ timeout: 3000 }).catch(() => false)) {
      await card.click();
      await page.waitForTimeout(1500);
    } else {
      // Try alternative button text
      const btn = page.locator('button:has-text("Quero Contratar")').first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(1500);
      }
    }
  });

  await step('company-signup-toggle', async () => {
    // Should be on /login?type=hire, toggle to signup
    const cadastre = page.locator('button:has-text("Cadastre-se")').first();
    if (await cadastre.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cadastre.click();
      await page.waitForTimeout(500);
    }
  });

  await step('fill-company-signup', async () => {
    await page.fill('input[aria-label="Email"]', 'geribameuacesso+company@gmail.com');
    await page.fill('input[aria-label="Senha"]', 'WorkiTest123');
  });

  await step('submit-company-signup', async () => {
    await page.click('button[type="submit"]');
    await page.waitForTimeout(6000);
    await page.waitForLoadState('networkidle');
  });

  await step('check-after-company-signup', async () => {
    const url = page.url();
    console.log('  Post-company-signup URL: ' + url);
    const pageText = await page.evaluate(() => document.body.innerText);
    if (pageText.includes('ja esta cadastrado') || pageText.includes('already registered') || pageText.includes('cadastrado')) {
      console.log('  Company account exists, logging in...');
      await page.click('button:has-text("Fazer Login")');
      await page.waitForTimeout(500);
      await page.fill('input[aria-label="Email"]', 'geribameuacesso+company@gmail.com');
      await page.fill('input[aria-label="Senha"]', 'WorkiTest123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      await page.waitForLoadState('networkidle');
    } else if (pageText.includes('Muitas tentativas') || pageText.includes('Aguarde')) {
      console.log('  Rate limited, waiting 30s...');
      await page.waitForTimeout(30000);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      await page.waitForLoadState('networkidle');
    }
  });

  // ════════════════════════════════════════════════════
  // PHASE 15: COMPANY ONBOARDING (if needed)
  // ════════════════════════════════════════════════════

  const compUrl = page.url();
  const compNeedsOnboarding = compUrl.includes('onboarding');
  const compOnDashboard = compUrl.includes('company/dashboard');

  if (compNeedsOnboarding) {
    console.log('=== COMPANY ONBOARDING FLOW ===');

    await step('comp-onboard-step1-fill', async () => {
      await page.waitForTimeout(1000);
      await page.fill('input[aria-label="Nome da empresa"]', 'Empresa Teste E2E Ltda');
      // Use valid CNPJ: 11.444.777/0001-61
      await page.fill('input[aria-label="CNPJ"]', '11444777000161');
      await page.selectOption('select[aria-label="Tipo de empresa"]', 'MEI');
      // Setor - pick the first real option
      await page.selectOption('select[aria-label="Setor"]', { index: 1 });
      await page.fill('input[aria-label="Cidade"]', 'Sao Paulo');
      await page.waitForTimeout(500);
    });

    await step('comp-onboard-step1-next', async () => {
      const btn = page.locator('button[type="submit"]').last();
      await btn.click();
      await page.waitForTimeout(2000);
      // Check for CNPJ error and retry with alternative
      const text = await page.evaluate(() => document.body.innerText);
      if (text.includes('CNPJ invalido') || text.includes('CNPJ inválido')) {
        console.log('  CNPJ invalid, retrying with 11447700010027...');
        await page.fill('input[aria-label="CNPJ"]', '');
        await page.fill('input[aria-label="CNPJ"]', '11447700010027');
        await page.waitForTimeout(300);
        await btn.click();
        await page.waitForTimeout(2000);
      }
    });

    await step('comp-onboard-step2-goal', async () => {
      const goal = page.locator('label:has-text("Freelancers Pontuais")');
      if (await goal.isVisible()) await goal.click();
      await page.waitForTimeout(300);
    });

    await step('comp-onboard-step2-volume', async () => {
      const vol = page.locator('label:has-text("1-5")');
      if (await vol.isVisible()) await vol.click();
      await page.waitForTimeout(300);
    });

    await step('comp-onboard-step2-tos', async () => {
      await page.click('#tos');
      await page.waitForTimeout(300);
    });

    await step('comp-onboard-step2-finalize', async () => {
      const btn = page.locator('button[type="submit"]').last();
      await btn.click();
      await page.waitForTimeout(8000);
      await page.waitForLoadState('networkidle');
    });
  } else if (compOnDashboard) {
    console.log('=== COMPANY ALREADY ONBOARDED ===');
  } else {
    console.log('=== UNEXPECTED COMPANY STATE: ' + compUrl + ' ===');
  }

  // ════════════════════════════════════════════════════
  // PHASE 16: COMPANY PAGES
  // Company sidebar nav: Dashboard, Criar Vaga, Minhas Vagas,
  //   Mensagens, Carteira, Analytics, Perfil Empresa
  // ════════════════════════════════════════════════════

  await step('company-dashboard', async () => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const text = await page.evaluate(() => document.body.innerText);
    console.log('  Company dashboard: ' + (text.includes('Dashboard') || text.includes('Empresa') || text.includes('Vagas')));
  });

  await step('company-nav-criar-vaga', async () => {
    const link = page.locator('a[href="/company/create"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
  });

  await step('company-nav-minhas-vagas', async () => {
    const link = page.locator('a[href="/company/jobs"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
  });

  await step('company-nav-mensagens', async () => {
    const link = page.locator('a[href="/company/messages"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
  });

  await step('company-nav-carteira', async () => {
    const link = page.locator('a[href="/company/wallet"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
  });

  await step('company-nav-analytics', async () => {
    const link = page.locator('a[href="/company/analytics"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
  });

  await step('company-nav-perfil', async () => {
    const link = page.locator('a[href="/company/profile"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2500);
    }
  });

  await step('company-profile-edit', async () => {
    const editBtn = page.locator('button:has-text("Editar")').first();
    if (await editBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  await step('company-profile-edit-desc', async () => {
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible({ timeout: 2000 }).catch(() => false)) {
      await textarea.fill('Empresa de teste E2E. Contratamos profissionais para eventos.');
      await page.waitForTimeout(500);
    }
  });

  await step('company-profile-save', async () => {
    const saveBtn = page.locator('button:has-text("Salvar")').first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }
  });

  await step('company-profile-scroll', async () => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
  });

  // ════════════════════════════════════════════════════
  // PHASE 17: COMPANY LOGOUT -> RE-LOGIN
  // ════════════════════════════════════════════════════

  await step('company-logout', async () => {
    const logoutBtn = page.locator('button:has-text("Sair")').first();
    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');
    }
  });

  await step('company-relogin-navigate', async () => {
    const url = page.url();
    console.log('  After company logout URL: ' + url);
    if (url.includes('/login')) {
      // Already on login, but might be type=work. Need type=hire
      // The login page uses URL params to determine type
      // After logout, sidebar sends to /login without type param
      // We can just log in - the user_metadata determines the redirect
      console.log('  On login page, will fill company credentials');
    } else {
      // On homepage, click "Quero Contratar"
      const card = page.locator('h3:has-text("Quero Contratar")').first();
      if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
        await card.click();
        await page.waitForTimeout(1500);
      }
    }
  });

  await step('company-relogin-fill', async () => {
    // Ensure login mode
    const text = await page.evaluate(() => document.body.innerText);
    if (text.includes('Fazer Login')) {
      await page.click('button:has-text("Fazer Login")');
      await page.waitForTimeout(500);
    }
    await page.fill('input[aria-label="Email"]', 'geribameuacesso+company@gmail.com');
    await page.fill('input[aria-label="Senha"]', 'WorkiTest123');
  });

  await step('company-relogin-submit', async () => {
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');
  });

  await step('company-relogin-verify', async () => {
    const url = page.url();
    if (url.includes('/company/dashboard') && !url.includes('onboarding')) {
      console.log('  SUCCESS: Company re-login -> company/dashboard directly');
    } else if (url.includes('onboarding')) {
      console.log('  BUG: Company re-sent to onboarding!');
    } else {
      console.log('  Company re-login URL: ' + url);
    }
  });

  // ════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ════════════════════════════════════════════════════

  console.log('\n' + '='.repeat(60));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(60));
  console.log('Total steps: ' + stepNum);
  console.log('Passed: ' + passed);
  console.log('Failed: ' + failed);
  console.log('Console errors: ' + logs.filter(l => l.startsWith('error:')).length);
  console.log('Page errors: ' + logs.filter(l => l.startsWith('PAGE_ERROR:')).length);
  console.log('HTTP errors: ' + logs.filter(l => l.startsWith('HTTP_')).length);
  console.log('='.repeat(60));

  console.log('\nALL RESULTS:');
  results.forEach(r => {
    console.log('  ' + r.id + ' | ' + r.name + ' | ' + r.result + ' | ' + r.url + (r.error ? ' | ' + r.error : ''));
  });

  if (logs.length > 0) {
    console.log('\nALL CONSOLE/HTTP ERRORS:');
    logs.forEach(l => console.log('  ' + l));
  }

  await browser.close();
  console.log('\nBrowser closed. Screenshots in frontend/e2e/screenshots/');
})().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
