// @ts-check
import tseslint from 'typescript-eslint';
import rootConfig from '../../eslint.config.js';

export default tseslint.config(
  ...rootConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'ngDiagram',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'ng-diagram',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/core/src/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../lib/**', '../lib/**', './lib/**', '@lib/**'],
              message: 'Core cannot import from lib folder.',
            },
            {
              group: ['@angular/**'],
              message: 'Core cannot import Angular.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    rules: {},
  }
);
