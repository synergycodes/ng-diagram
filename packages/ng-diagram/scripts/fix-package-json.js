#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, '../dist/ng-diagram/package.json');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Add style exports if they don't exist
  if (!packageJson.exports) {
    packageJson.exports = {};
  }

  packageJson.exports = {
    './package.json': {
      default: './package.json',
    },
    '.': {
      types: './index.d.ts',
      default: './fesm2022/ng-diagram.mjs',
    },
    './styles.css': './styles.css',
    './primitives.css': './primitives.css',
    './tokens.css': './tokens.css',
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✅ Fixed package.json exports`);
} catch (error) {
  console.error('❌ Error fixing package.json:', error.message);
  process.exit(1);
}
