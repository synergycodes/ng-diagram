// Automated runner for the demo app's "Awaitable Tests" mode.
// Prerequisites: `pnpm dev` running (demo on http://localhost:4200), Playwright browsers installed (`pnpm e2e:install`).
// Usage: node apps/e2e/awaitable-demo-check.mjs [screenshot.png]   (exit 0 = all scenarios passed)
import { chromium } from '@playwright/test';

const screenshotPath = process.argv[2];
const EXPECTED_SCENARIOS = 15; // must match the scenario list in awaitable-tests.component.ts runAll()
// Hard deadline: a hung suite must end as exit 1 WITH diagnostics, never a
// frozen process.
const WATCHDOG_MS = 180_000;

const consoleLines = [];
const pageErrors = [];
let browser;

const fail = async (message) => {
  console.error(`FAIL: ${message}`);
  console.log('--- console (full) ---');
  for (const line of consoleLines) console.log(line);
  if (browser) await browser.close().catch(() => undefined);
  process.exit(1);
};

const watchdog = setTimeout(() => void fail(`no verdict within ${WATCHDOG_MS}ms — suite or page hung`), WATCHDOG_MS);

let report;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
    consoleLines.push(`[pageerror] ${err.message}`);
  });

  await page.goto('http://localhost:4200');
  await page.waitForSelector('[data-node-id]', { timeout: 15000 });
  await page
    .waitForFunction(() => typeof globalThis.ng !== 'undefined', undefined, { timeout: 5000 })
    .catch(() => {
      throw new Error('globalThis.ng is undefined — the demo must run a DEV build (pnpm dev)');
    });
  await page.evaluate(() => {
    const app = ng.getComponent(document.querySelector('app-root'));
    app.enterAwaitableTest();
  });
  await page.waitForFunction(() => !!window.__awaitableTests, undefined, { timeout: 5000 });

  report = await page.evaluate(async () => {
    const summary = await window.__awaitableTests.runAll();
    return {
      passed: summary.passed,
      failed: summary.failed,
      results: summary.results.map((r) => ({
        name: r.name,
        ok: r.passed,
        ms: Math.round(r.elapsed),
        info: r.passed ? r.details : r.failures,
      })),
    };
  });

  console.log(JSON.stringify(report, null, 1));
  console.log('--- console (AwaitableTest / warnings / errors) ---');
  for (const line of consoleLines.filter((l) => /AwaitableTest|warn|error/i.test(l))) console.log(line);

  if (screenshotPath) {
    await page.screenshot({ path: screenshotPath });
    console.log(`screenshot saved: ${screenshotPath}`);
  }
} catch (error) {
  await fail(String(error));
}

if (pageErrors.length > 0) {
  await fail(`${pageErrors.length} page error(s): ${pageErrors.join(' | ')}`);
}
if (report.results.length !== EXPECTED_SCENARIOS) {
  await fail(`expected ${EXPECTED_SCENARIOS} scenario results, got ${report.results.length}`);
}

clearTimeout(watchdog);
await browser.close();
process.exitCode = report.failed === 0 ? 0 : 1;
