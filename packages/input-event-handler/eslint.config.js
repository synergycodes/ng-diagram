// @ts-check
import eslint from '@eslint/js';
import prettier from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  files: ['**/*.ts'],
  extends: [eslint.configs.recommended, ...tseslint.configs.recommended, ...tseslint.configs.stylistic, prettier],
});
