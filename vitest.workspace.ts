import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  './apps/angular-demo/vite.config.mts',
  './packages/core/vite.config.ts',
  './packages/angular-signals-model/vite.config.ts',
  './packages/angular-adapter/projects/angular-adapter/vite.config.mts',
]);
