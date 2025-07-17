/// <reference types="vitest" />

import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [angular()] as any,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['**/*.spec.ts'],
    reporters: ['default'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
    },
    typecheck: {
      tsconfig: './tsconfig.spec.json',
    },
  },
  define: {
    'import.meta.vitest': process.env['NODE_ENV'] !== 'production',
  },
});
