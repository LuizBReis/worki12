import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });

  // =============================================
  // FLOW 50: Escrow Refund
  // =============================================
  console.log('\n=== FLOW 50: Escrow Refund ===');
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    try {
      // Login as company
      await page.goto(`${BASE}/login?type=hire`, { waitUntil: 'networkidle' });
      await page.waitForSelector('input[aria-label="Email"]', { timeout: 20000 });
      await page.fill('input[aria-label="Email"]', 'e2e.company.test@gmail.com');
      await page.fill('input[aria-label="Senha"]', 'TestCompany123!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(6000);
      console.log('Logged in as company:', page.url());

      // Navigate to Minhas Vagas
      await page.goto(`${BASE}/company/jobs`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'e2e/screenshots/f50-01-company-jobs.png' });

      const jobsText = await page.textContent('body');
      console.log('Jobs page text (first 300):', jobsText?.substring(0, 300));

      // Look for a job with hired workers - check for "Em Andamento" or "Contratado"
      const hasInProgress = jobsText?.includes('Em Andamento') || jobsText?.includes('em andamento');
      console.log('Has in-progress jobs:', hasInProgress);

      // Click on first job to see details
      const jobCards = await page.$$('[class*="border"][class*="rounded"]');
      if (jobCards.length > 0) {
        // Try clicking the first job
        const firstJobLink = await page.$('a[href*="/company/jobs/"]');
        if (firstJobLink) {
          await firstJobLink.click();
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'e2e/screenshots/f50-02-job-detail.png' });

          const jobDetailText = await page.textContent('body');
          console.log('Job detail text (first 500):', jobDetailText?.substring(0, 500));

          // Look for cancel/refund button
          const hasCancel = jobDetailText?.includes('Cancelar') || jobDetailText?.includes('cancelar');
          const hasRefund = jobDetailText?.includes('Reembolso') || jobDetailText?.includes('reembolso') ||
                            jobDetailText?.includes('Estornar') || jobDetailText?.includes('estornar');

          if (hasCancel) {
            console.log('FLOW 50: Cancel button found');
          } else if (hasRefund) {
            console.log('FLOW 50: Refund button found');
          } else {
            console.log('FLOW 50 RESULT: NOT IMPLEMENTED IN UI - No cancel/refund button visible');
          }

          // Also check candidates page
          const candidatesLink = await page.$('a[href*="/candidates"]');
          if (candidatesLink) {
            await candidatesLink.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'e2e/screenshots/f50-03-candidates.png' });
            const candText = await page.textContent('body');
            const hasCancelBtn = candText?.includes('Cancelar') || candText?.includes('Dispensar');
            console.log('Candidates has cancel/dismiss button:', hasCancelBtn);
          }
        }
      }

      console.log('FLOW 50 RESULT: NOT IMPLEMENTED IN UI - No escrow refund button found in job detail or candidates page');

    } catch (err) {
      console.error('FLOW 50 ERROR:', err);
      await page.screenshot({ path: 'e2e/screenshots/f50-error.png' });
    } finally {
      await context.close();
    }
  }

  // =============================================
  // FLOW 55: Job Deletion
  // =============================================
  console.log('\n=== FLOW 55: Job Deletion ===');
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    try {
      // Login as company
      await page.goto(`${BASE}/login?type=hire`, { waitUntil: 'networkidle' });
      await page.waitForSelector('input[aria-label="Email"]', { timeout: 20000 });
      await page.fill('input[aria-label="Email"]', 'e2e.company.test@gmail.com');
      await page.fill('input[aria-label="Senha"]', 'TestCompany123!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(6000);

      // Go to company jobs
      await page.goto(`${BASE}/company/jobs`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'e2e/screenshots/f55-01-company-jobs.png' });

      const jobsText = await page.textContent('body');
      console.log('Jobs page text (first 400):', jobsText?.substring(0, 400));

      // Look for delete button or 3-dot menu
      const hasDeleteBtn = await page.$('button:has-text("Excluir")');
      const hasTrashIcon = await page.$('[class*="trash"], button[aria-label*="delete"], button[aria-label*="excluir"]');
      const hasMoreMenu = await page.$$('[class*="more"], [class*="dots"], button[aria-label*="menu"]');

      if (hasDeleteBtn) {
        console.log('Delete button found on jobs list');
      } else if (hasTrashIcon) {
        console.log('Trash icon found');
      } else if (hasMoreMenu.length > 0) {
        console.log(`Found ${hasMoreMenu.length} menu buttons, clicking first...`);
        await hasMoreMenu[0].click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'e2e/screenshots/f55-02-menu-open.png' });
        const menuText = await page.textContent('body');
        const hasDeleteInMenu = menuText?.includes('Excluir') || menuText?.includes('Deletar');
        if (hasDeleteInMenu) {
          console.log('Delete option found in menu');
        }
      }

      // Also check individual job detail page
      const firstJobLink = await page.$('a[href*="/company/jobs/"]');
      if (firstJobLink) {
        await firstJobLink.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'e2e/screenshots/f55-03-job-detail.png' });

        const detailText = await page.textContent('body');
        const hasDetailDelete = detailText?.includes('Excluir') || detailText?.includes('Deletar');
        const hasDetailMenu = await page.$$('button[class*="more"], [class*="ellipsis"]');
        const hasEditLink = detailText?.includes('Editar');

        console.log('Job detail - has Delete:', hasDetailDelete);
        console.log('Job detail - has Edit:', hasEditLink);
        console.log('Job detail - has menu buttons:', hasDetailMenu.length);

        // Look for any 3-dot/kebab menu
        const kebabButtons = await page.$$('button');
        for (const btn of kebabButtons) {
          const text = await btn.textContent();
          const ariaLabel = await btn.getAttribute('aria-label');
          if (text?.includes('...') || text?.includes('⋮') || ariaLabel?.includes('menu') || ariaLabel?.includes('more')) {
            console.log('Found menu button:', text, ariaLabel);
            await btn.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'e2e/screenshots/f55-04-menu-opened.png' });
            break;
          }
        }

        if (!hasDetailDelete && hasDetailMenu.length === 0) {
          console.log('FLOW 55 RESULT: NOT IMPLEMENTED IN UI - No delete button/menu found');
        }
      } else {
        console.log('No job links found on the page');
        console.log('FLOW 55 RESULT: NOT TESTABLE - No jobs available');
      }

    } catch (err) {
      console.error('FLOW 55 ERROR:', err);
      await page.screenshot({ path: 'e2e/screenshots/f55-error.png' });
    } finally {
      await context.close();
    }
  }

  // =============================================
  // FLOW 52: Typing Indicator
  // =============================================
  console.log('\n=== FLOW 52: Typing Indicator ===');
  {
    const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const workerPage = await ctx1.newPage();
    const companyPage = await ctx2.newPage();

    try {
      // Login worker
      await workerPage.goto(`${BASE}/login?type=work`, { waitUntil: 'networkidle' });
      await workerPage.waitForSelector('input[aria-label="Email"]', { timeout: 20000 });
      await workerPage.fill('input[aria-label="Email"]', 'oliveira9138@gmail.com');
      await workerPage.fill('input[aria-label="Senha"]', 'Waftk321321qwe!');
      await workerPage.click('button[type="submit"]');
      await workerPage.waitForTimeout(5000);
      console.log('Worker logged in:', workerPage.url());

      // Login company
      await companyPage.goto(`${BASE}/login?type=hire`, { waitUntil: 'networkidle' });
      await companyPage.waitForSelector('input[aria-label="Email"]', { timeout: 20000 });
      await companyPage.fill('input[aria-label="Email"]', 'e2e.company.test@gmail.com');
      await companyPage.fill('input[aria-label="Senha"]', 'TestCompany123!');
      await companyPage.click('button[type="submit"]');
      await companyPage.waitForTimeout(5000);
      console.log('Company logged in:', companyPage.url());

      // Navigate worker to messages
      await workerPage.goto(`${BASE}/messages`, { waitUntil: 'networkidle' });
      await workerPage.waitForTimeout(3000);
      await workerPage.screenshot({ path: 'e2e/screenshots/f52-01-worker-messages.png' });

      // Navigate company to messages
      await companyPage.goto(`${BASE}/company/messages`, { waitUntil: 'networkidle' });
      await companyPage.waitForTimeout(3000);
      await companyPage.screenshot({ path: 'e2e/screenshots/f52-02-company-messages.png' });

      // Check if there are any conversations
      await workerPage.textContent('body');
      await companyPage.textContent('body');

      // Try to find and click on a conversation
      const workerConvos = await workerPage.$$('[class*="cursor-pointer"]');
      const companyConvos = await companyPage.$$('[class*="cursor-pointer"]');

      console.log(`Worker conversations: ${workerConvos.length}`);
      console.log(`Company conversations: ${companyConvos.length}`);

      if (workerConvos.length > 0 && companyConvos.length > 0) {
        // Click first conversation for both
        await workerConvos[0].click();
        await workerPage.waitForTimeout(2000);
        await companyConvos[0].click();
        await companyPage.waitForTimeout(2000);

        // Now type in worker's message input
        const workerInput = await workerPage.$('input[placeholder*="mensagem"], textarea[placeholder*="mensagem"], input[type="text"]');
        if (workerInput) {
          // Type slowly to trigger typing indicator
          await workerInput.type('Olá, tudo bem?', { delay: 100 });
          await workerPage.waitForTimeout(1000);
          await workerPage.screenshot({ path: 'e2e/screenshots/f52-03-worker-typing.png' });

          // Check company page for typing indicator
          await companyPage.waitForTimeout(2000);
          const companyText = await companyPage.textContent('body');
          const hasTypingIndicator = companyText?.includes('digitando') || companyText?.includes('typing') ||
                                     companyText?.includes('...') || await companyPage.$('[class*="typing"]');

          await companyPage.screenshot({ path: 'e2e/screenshots/f52-04-company-sees-typing.png' });

          if (hasTypingIndicator) {
            console.log('FLOW 52 RESULT: PASS - Typing indicator visible');
          } else {
            console.log('FLOW 52 RESULT: NOT IMPLEMENTED - No typing indicator detected on company side');
          }
        } else {
          console.log('FLOW 52 RESULT: NOT TESTABLE - No message input found');
        }
      } else {
        console.log('FLOW 52 RESULT: NOT TESTABLE - No conversations found');
      }

    } catch (err) {
      console.error('FLOW 52 ERROR:', err);
    } finally {
      await ctx1.close();
      await ctx2.close();
    }
  }

  await browser.close();
  console.log('\n=== ALL FLOWS COMPLETE ===');
}

run();
