import { expect, test } from '@playwright/test';
import { brokenTabWords, measureOverflow, openLanding, PAGES, WIDTHS } from './support';

/** WCAG 1.4.12 Text Spacing: the values a reader may override the page with. */
const TEXT_SPACING = `
  * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
  p { margin-bottom: 2em !important; }
`;

for (const path of PAGES) {
  test.describe(`${path} layout at every width`, () => {
    for (const width of WIDTHS) {
      test(`${width}px: no overflow, header height, tab names`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await openLanding(page, path);

        expect(await measureOverflow(page)).toEqual({ page: 0, bars: [] });

        // The bar is 72px at most (64px up to 64em); the header adds its 1px bottom border.
        const heights = await page.evaluate(() => ({
          navbar: document.querySelector('.navbar')!.getBoundingClientRect().height,
          header: document.querySelector('header')!.getBoundingClientRect().height,
        }));
        expect(heights.navbar).toBeLessThanOrEqual(72);
        expect(heights.header).toBeLessThanOrEqual(73);

        // O5: a tab name wraps between words, never inside one.
        expect(await brokenTabWords(page)).toEqual([]);
      });
    }
  });

  test.describe(`${path} text spacing (WCAG 1.4.12)`, () => {
    for (const width of [320, 390, 768, 1024, 1440]) {
      test(`${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await openLanding(page, path);
        await page.addStyleTag({ content: TEXT_SPACING });

        expect(await measureOverflow(page)).toEqual({ page: 0, bars: [] });
        expect(await brokenTabWords(page)).toEqual([]);
      });
    }
  });

  test.describe(`${path} default font size 200%`, () => {
    // Changes the browser's default font size, which `em` media queries follow. The narrowest
    // width is 640px: at 200% that is 20em, the 320px reflow width of WCAG 1.4.10.
    for (const width of [640, 768, 1440]) {
      test(`${width}px`, async ({ page, browserName }) => {
        test.skip(browserName !== 'chromium', 'Uses the Chrome DevTools Protocol.');
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Page.enable');
        await cdp.send('Page.setFontSizes', { fontSizes: { standard: 32, fixed: 26 } });
        await page.setViewportSize({ width, height: 900 });
        await openLanding(page, path);

        expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('32px');
        expect(await measureOverflow(page)).toEqual({ page: 0, bars: [] });
        expect(await brokenTabWords(page)).toEqual([]);
      });
    }
  });
}

test.describe('first screen (O7)', () => {
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1366, height: 768 },
  ]) {
    test(`${viewport.width}x${viewport.height}: the stage and the calls to action are above the fold`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openLanding(page);
      const bottoms = await page.evaluate(() => ({
        stage: document.querySelector('.hero-stage')!.getBoundingClientRect().bottom,
        cta: document.querySelector('.hero .cta-row')!.getBoundingClientRect().bottom,
      }));
      expect(bottoms.stage).toBeLessThanOrEqual(viewport.height);
      expect(bottoms.cta).toBeLessThanOrEqual(viewport.height);
    });
  }
});

test.describe('closing call (O6)', () => {
  // The call has every block's padding (here the FAQ's): its title stands as far below the project
  // facts band's bottom rule as a block's title below its own top rule, and the same padding
  // closes it below its button.
  for (const width of [320, 390, 720, 721, 1024, 1025, 1440]) {
    test(`${width}px: the call has the blocks' padding`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await openLanding(page);
      const gaps = await page.evaluate(() => {
        const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
        const style = (selector: string) => getComputedStyle(document.querySelector(selector)!);
        return {
          aboveTitle: box('#closing-title').top - box('.quad-sec .quad').bottom,
          blockAboveTitle: box('#faq-title').top - box('#faq').top - parseFloat(style('#faq').borderTopWidth),
          bottom: style('#community > .wrap').paddingBottom,
          blockBottom: style('#faq > .wrap').paddingBottom,
        };
      });
      expect(gaps.blockAboveTitle).toBeGreaterThan(0);
      expect(Math.round(gaps.aboveTitle)).toBe(Math.round(gaps.blockAboveTitle));
      expect(gaps.bottom).toBe(gaps.blockBottom);
    });
  }
});

test('/contact 1440x900: step 1 of the form is in the first screen', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openLanding(page, '/contact');
  const bottom = await page.evaluate(() => document.querySelector('#cf-email')!.getBoundingClientRect().bottom);
  expect(bottom).toBeLessThanOrEqual(900);
});
