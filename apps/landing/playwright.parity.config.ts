import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * Parity with the mockup, local only: `MOCKUP_PATH=<mockup.html> pnpm --filter landing parity`.
 * A classic (non-overlay) scrollbar, as on Windows desktops.
 */
export default defineConfig({
  ...baseConfig,
  testIgnore: [],
  testMatch: ['**/parity.spec.ts'],
  reporter: [['list']],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] },
      },
    },
  ],
});
