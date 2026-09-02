import { defineConfig, devices } from '@playwright/test';

const againstExistingServer = Boolean(process.env.PLAYWRIGHT_BASE_URL);
// The Cloudflare-backed Vinext server binds to `localhost`; keep Playwright's
// readiness probe on the same hostname.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4173';
const channel = process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === '1' ? 'chrome' : undefined;

export default defineConfig({
  testDir: './tests/browser',
  outputDir: 'test-results',
  timeout: 30_000,
  expect: { timeout: 7_500 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL,
    channel,
    colorScheme: 'light',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-1440x900',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile-390x844',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
  webServer: againstExistingServer
    ? undefined
    : {
        command: './node_modules/.bin/vinext dev --host localhost --port 4173',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: 'ignore',
        stderr: 'pipe',
        gracefulShutdown: { signal: 'SIGTERM', timeout: 500 },
      },
});
