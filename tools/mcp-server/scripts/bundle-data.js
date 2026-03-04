/**
 * Copies documentation files and the API report into dist/data/
 * so the published npm package is fully self-contained.
 */

import { cpSync, existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const root = resolve(__dirname, '../../..');
const dist = resolve(__dirname, '../dist');

const docsSrc = resolve(root, 'apps/docs/src/content/docs');
const docsDest = resolve(dist, 'data/docs');

const apiReportSrc = resolve(root, 'packages/ng-diagram/api-report/ng-diagram.api.md');
const apiReportDest = resolve(dist, 'data/ng-diagram.api.md');

// Copy docs
if (!existsSync(docsSrc)) {
  console.error(`[bundle-data] docs directory not found: ${docsSrc}`);
  process.exit(1);
}

mkdirSync(docsDest, { recursive: true });
cpSync(docsSrc, docsDest, { recursive: true, filter: (src) => !src.endsWith('.DS_Store') });
console.log(`[bundle-data] Copied docs → ${docsDest}`);

// Copy API report
if (!existsSync(apiReportSrc)) {
  console.error(`[bundle-data] API report not found: ${apiReportSrc}`);
  process.exit(1);
}

mkdirSync(dirname(apiReportDest), { recursive: true });
cpSync(apiReportSrc, apiReportDest);
console.log(`[bundle-data] Copied API report → ${apiReportDest}`);
