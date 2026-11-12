import { expect, test } from '@playwright/test';
import { axeViolations as violations, openLanding, PAGES, waitForHeroSettled } from './support';

for (const path of PAGES) {
  for (const width of [390, 768, 1024, 1440]) {
    test.describe(`${path} ${width}px`, () => {
      test.beforeEach(async ({ page }) => {
        // The contact page never sends anything while it is tested.
        await page.route('https://api.hsforms.com/**', (route) => route.abort());
        await page.setViewportSize({ width, height: 900 });
        await openLanding(page, path);
        await waitForHeroSettled(page);
      });

      test('page', async ({ page }) => {
        expect(await violations(page)).toEqual([]);
      });

      if (width <= 1024) {
        test('menu open', async ({ page }) => {
          await page.click('.nav-toggle');
          await expect(page.locator('header')).toHaveClass(/nav-open/);
          expect(await violations(page)).toEqual([]);
        });
      }
    });
  }
}

for (const width of [390, 1440]) {
  test(`${width}px: every FAQ answer open, then the video dialog`, async ({ page }) => {
    await page.route(/youtube|ytimg|googlevideo/, (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<p>player</p>' })
    );
    await page.setViewportSize({ width, height: 900 });
    await openLanding(page);
    await waitForHeroSettled(page);
    for (const question of await page.locator('.faq-item summary').all()) {
      await question.click();
    }
    expect(await violations(page), 'FAQ open').toEqual([]);
    await page.locator('.res .links [data-video]').first().click();
    await expect(page.locator('[data-video-dialog]')).toBeVisible();
    expect(await violations(page), 'dialog open').toEqual([]);
  });
}

test('every template tab (1440px)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openLanding(page);
  await waitForHeroSettled(page);
  const tabs = page.locator('.tpl-tab');
  for (let index = 0; index < (await tabs.count()); index++) {
    await tabs.nth(index).click();
    await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
    expect(await violations(page), `tab ${index + 1}`).toEqual([]);
  }
});
