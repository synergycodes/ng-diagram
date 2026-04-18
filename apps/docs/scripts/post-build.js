import { cpSync, copyFileSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distDir = join(root, 'dist');
const tmpDir = join(root, 'tmp-dist');

// Restructure: move dist → tmp-dist, create dist/docs from tmp-dist
renameSync(distDir, tmpDir);
mkdirSync(distDir);
// rename does not work across devices/partitions, but cpSync+rm does on all OS
try {
  renameSync(tmpDir, join(distDir, 'docs'));
} catch {
  cpSync(tmpDir, join(distDir, 'docs'), { recursive: true });
  rmSync(tmpDir, { recursive: true, force: true });
}

const distDocsDir = join(distDir, 'docs');

// Copy root-level files from /docs/ to domain root so they are served at
// ngdiagram.dev/llms.txt, ngdiagram.dev/robots.txt, etc.
for (const file of ['llms.txt', 'llms-full.txt', 'robots.txt']) {
  copyFileSync(join(distDocsDir, file), join(distDir, file));
}

// Create empty index.html for root redirect
writeFileSync(join(distDir, 'index.html'), '', 'utf-8');

console.log('✅ Post-build: dist restructured, root files copied');
