import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['**/*.spec.ts'],
    reporters: ['default'],
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'AngularSignalsModel',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@angular/core'],
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }) as any,
  ],
});
