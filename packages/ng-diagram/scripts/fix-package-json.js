#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, '../dist/ng-diagram/package.json');
const corePackageJsonPath = path.join(__dirname, '../../core/package.json');

try {
  // Read the core package version
  const corePackageJson = JSON.parse(fs.readFileSync(corePackageJsonPath, 'utf8'));
  const coreVersion = corePackageJson.version;

  if (!coreVersion) {
    throw new Error('Could not find version in core package.json');
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Fix the @angularflow/core dependency to use proper version instead of workspace:*
  if (packageJson.peerDependencies && packageJson.peerDependencies['@angularflow/core'] === 'workspace:*') {
    packageJson.peerDependencies['@angularflow/core'] = `^${coreVersion}`;
  }

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
  console.log(`✅ Fixed package.json exports and dependencies (core version: ${coreVersion})`);
} catch (error) {
  console.error('❌ Error fixing package.json:', error.message);
  process.exit(1);
}
