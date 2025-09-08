import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    sourcemap: process.env.NODE_ENV === 'development',
    minify: process.env.NODE_ENV !== 'development',
    lib: {
      entry: 'src/index.ts',
      name: 'Core',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: [],
    },
    target: 'es2020',
  },
  esbuild: {
    target: 'es2020',
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }) as any,
  ],
  test: {
    setupFiles: ['./src/set.polyfill.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
    },
  },
});
