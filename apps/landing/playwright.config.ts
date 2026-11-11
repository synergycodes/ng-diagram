import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests of the built landing page, served by `astro preview`. Build first
 * (`pnpm --filter landing build`). The parity test against the mockup has its own config.
 */
const PORT = Number(process.env['LANDING_PORT'] ?? 4329);
const baseURL = `http://localhost:${PORT}`;
const isCI = !!process.env['CI'];

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/parity.spec.ts'],
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }], ['list']] : [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm preview --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
