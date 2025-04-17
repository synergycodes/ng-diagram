import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
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
