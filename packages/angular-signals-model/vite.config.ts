import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

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
    }),
  ],
});
