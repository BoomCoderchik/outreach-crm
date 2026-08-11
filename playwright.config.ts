import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['line']],
  use: { baseURL: 'http://127.0.0.1:4173', ...devices['Desktop Chrome'] },
  webServer: [
    {
      command: 'npm run service:dev',
      url: 'http://127.0.0.1:8787/health',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run preview -- --host 127.0.0.1',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
