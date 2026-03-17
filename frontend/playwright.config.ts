import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 60_000,
    expect: { timeout: 15_000 },
    retries: 0,
    workers: 1,
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
        headless: process.env.PLAYWRIGHT_HEADED !== '1',
        screenshot: 'on',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
        launchOptions: {
            slowMo: process.env.PLAYWRIGHT_HEADED === '1' ? 500 : 0,
        },
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 30_000,
    },
    outputDir: './e2e/test-results',
    reporter: [['list'], ['html', { open: 'never', outputFolder: './e2e/playwright-report' }]],
});
