// @ts-check
import globals from 'globals';
import eslint from '@eslint/js';
import prettier from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'eslint/config';
import { includeIgnoreFile } from '@eslint/compat';

const gitIgnorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default defineConfig([
  includeIgnoreFile(gitIgnorePath),
  eslint.configs.recommended,
  astro.configs.recommended,
  prettier,
  // @ts-expect-error Incompatible types of defineConfig() and tseslint -https://github.com/typescript-eslint/typescript-eslint/issues/10899
  tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]);
