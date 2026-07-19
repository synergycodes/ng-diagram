// Automated runner for the demo app's "Awaitable Tests" mode.
// Prerequisites: `pnpm dev` running (demo on http://localhost:4200), Playwright browsers installed (`pnpm e2e:install`).
// Usage: node apps/e2e/awaitable-demo-check.mjs [screenshot.png]   (exit 0 = all scenarios passed)
import { chromium } from '@playwright/test';

const screenshotPath = process.argv[2];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

const consoleLines = [];
page.on('console', (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => consoleLines.push(`[pageerror] ${err.message}`));

await page.goto('http://localhost:4200');
await page.waitForSelector('[data-node-id]', { timeout: 15000 });
await page.waitForTimeout(2000);

const report = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const app = ng.getComponent(document.querySelector('app-root'));
  app.enterAwaitableTest();
  await sleep(200);
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

await browser.close();
process.exitCode = report.failed === 0 ? 0 : 1;
