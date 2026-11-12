// Lighthouse budgets of the landing page (plan, section 6), against a running `astro preview`.
//
//   pnpm --filter landing build && pnpm --filter landing preview --port 4329   # in one terminal
//   pnpm --filter landing perf                                                 # in another
//
// LANDING_URL (default http://localhost:4329/) and RUNS (default 3, the median run counts).
// Reports go to apps/landing/reports/lighthouse-<preset>.json. Byte budgets are checked as
// gzip sizes of the built files, so they do not depend on how the server compresses responses.

import { chromium } from '@playwright/test';
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const LIGHTHOUSE = 'lighthouse@13.6.0';
const url = process.env.LANDING_URL ?? 'http://localhost:4329/';
const runs = Number(process.env.RUNS ?? 3);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const reports = join(root, 'reports');
const dist = join(root, 'dist');
const KB = 1024;

const budgets = {
  mobile: {
    scores: { performance: 0.95, accessibility: 1, 'best-practices': 0.95, seo: 0.95 },
    metrics: { 'largest-contentful-paint': 2000, 'cumulative-layout-shift': 0.05, 'total-blocking-time': 100 },
    scriptGzip: 15 * KB,
    islandAllowed: false,
  },
  desktop: {
    scores: { performance: 0.95, accessibility: 1, 'best-practices': 0.95, seo: 0.95 },
    metrics: { 'largest-contentful-paint': 1200, 'cumulative-layout-shift': 0.05 },
    scriptGzip: null,
    islandAllowed: true,
  },
};
const STYLE_GZIP = 20 * KB;
const ISLAND_GZIP = 250 * KB;
const ISLAND = /\/_landing\/bootstrap\.[^/]*\.js$/;

try {
  await fetch(url);
} catch {
  console.error(`No server at ${url}. Start it with: pnpm --filter landing preview --port 4329`);
  process.exit(2);
}

mkdirSync(reports, { recursive: true });
const chromePath = chromium.executablePath();
/** Quotes one shell argument (paths and the Chrome flags contain spaces). */
const quote = (arg) => (/[\s"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg);

/** Gzip size of a built file, by its URL path. */
const gzipOf = (path) => {
  try {
    return gzipSync(readFileSync(join(dist, decodeURIComponent(path)))).length;
  } catch {
    return 0;
  }
};

function runLighthouse(preset, index) {
  const output = join(reports, `lighthouse-${preset}-${index}.json`);
  const args = [
    'pnpm',
    'dlx',
    LIGHTHOUSE,
    url,
    '--quiet',
    '--output=json',
    `--output-path=${output}`,
    `--chrome-path=${chromePath}`,
    '--chrome-flags=--headless=new --no-sandbox',
    '--only-categories=performance,accessibility,best-practices,seo',
  ];
  if (preset === 'desktop') {
    args.push('--preset=desktop');
  }
  execSync(args.map(quote).join(' '), { stdio: 'inherit' });
  return JSON.parse(readFileSync(output, 'utf8'));
}

const failures = [];
const check = (label, ok, value) => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}: ${value}`);
  if (!ok) {
    failures.push(label);
  }
};

for (const [preset, budget] of Object.entries(budgets)) {
  const results = Array.from({ length: runs }, (_, index) => runLighthouse(preset, index + 1));
  results.sort((a, b) => a.categories.performance.score - b.categories.performance.score);
  const report = results[Math.floor(results.length / 2)];
  console.log(`\n${preset} (median of ${runs}, Lighthouse ${report.lighthouseVersion})`);

  for (const [category, min] of Object.entries(budget.scores)) {
    const score = report.categories[category].score;
    check(`${preset} ${category} ≥ ${min * 100}`, score >= min, Math.round(score * 100));
  }
  for (const [metric, max] of Object.entries(budget.metrics)) {
    const value = report.audits[metric].numericValue;
    check(
      `${preset} ${metric} ≤ ${max}`,
      value <= max,
      metric.includes('shift') ? value.toFixed(3) : `${Math.round(value)} ms`
    );
  }
  if (!('total-blocking-time' in budget.metrics)) {
    console.log(`  info total-blocking-time: ${Math.round(report.audits['total-blocking-time'].numericValue)} ms`);
  }

  const requests = report.audits['network-requests'].details.items;
  const origin = new URL(url).origin;
  const external = requests.filter((item) => !item.url.startsWith(origin) && !item.url.startsWith('data:'));
  check(`${preset} no external hosts`, external.length === 0, external.map((item) => item.url).join(', ') || 'none');

  const pathOf = (item) => new URL(item.url).pathname;
  const scripts = requests.filter((item) => item.resourceType === 'Script');
  const island = scripts.filter((item) => ISLAND.test(pathOf(item)));
  const pageScripts = scripts.filter((item) => !ISLAND.test(pathOf(item)));
  const pageScriptGzip = pageScripts.reduce((sum, item) => sum + gzipOf(pathOf(item)), 0);
  if (budget.scriptGzip !== null) {
    check(
      `${preset} page JS ≤ ${budget.scriptGzip / KB} KB gzip`,
      pageScriptGzip <= budget.scriptGzip,
      `${(pageScriptGzip / KB).toFixed(1)} KB`
    );
  } else {
    console.log(`  info page JS: ${(pageScriptGzip / KB).toFixed(1)} KB gzip`);
  }
  if (budget.islandAllowed) {
    const islandGzip = island.reduce((sum, item) => sum + gzipOf(pathOf(item)), 0);
    check(
      `${preset} island chunk ≤ ${ISLAND_GZIP / KB} KB gzip`,
      islandGzip <= ISLAND_GZIP,
      island.length ? `${(islandGzip / KB).toFixed(1)} KB` : 'not loaded'
    );
  } else {
    check(`${preset} no island requests`, island.length === 0, island.length ? island.map(pathOf).join(', ') : 'none');
  }
  const styleGzip = requests
    .filter((item) => item.resourceType === 'Stylesheet')
    .reduce((sum, item) => sum + gzipOf(pathOf(item)), 0);
  // The page's CSS is inlined by Astro when it is small; count the inline <style> too.
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const inlineCss = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => match[1]).join('');
  const cssGzip = styleGzip + gzipSync(inlineCss).length;
  check(`${preset} page CSS ≤ ${STYLE_GZIP / KB} KB gzip`, cssGzip <= STYLE_GZIP, `${(cssGzip / KB).toFixed(1)} KB`);
}

if (failures.length) {
  console.error(`\n${failures.length} budget(s) failed: ${failures.join('; ')}`);
  process.exit(1);
}
console.log('\nAll budgets met.');
