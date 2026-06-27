import { defineConfig, devices } from '@playwright/test'

/**
 * E2E tests require both servers to be running:
 *   - Next.js frontend on port 3000
 *   - Express API on port 4000
 *
 * Run: npx playwright test
 * CI: uses the webServer config to start both automatically.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,       // sequential — tests share state via seeded DB
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start both servers when running E2E locally or in CI
  webServer: [
    {
      command: 'npm run dev --workspace=packages/api',
      url: 'http://localhost:4000/health',
      reuseExistingServer: !process.env['CI'],
      timeout: 30_000,
    },
    {
      command: 'npm run dev --workspace=apps/web',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env['CI'],
      timeout: 60_000,
    },
  ],
})
