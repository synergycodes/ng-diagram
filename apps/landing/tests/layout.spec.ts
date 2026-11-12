import { expect, test, type Page } from '@playwright/test';
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
  // Two columns: the stage fills its column up to the mockup's 640px at every window height. The
  // copy stays centred on it while its buttons then fit in the first screen with 24px to spare,
  // and in a shorter window moves up only as far as they need.
  for (const { centred, ...viewport } of [
    { width: 1440, height: 900, centred: true },
    { width: 1366, height: 768, centred: true },
    { width: 1280, height: 720, centred: true },
    { width: 1440, height: 660, centred: false },
    { width: 1280, height: 640, centred: false },
    { width: 1440, height: 600, centred: false },
    { width: 1100, height: 640, centred: false },
  ]) {
    test(`${viewport.width}x${viewport.height}: the stage keeps its size, the calls to action are in the first screen`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openLanding(page);
      const hero = await page.evaluate(() => {
        const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
        const tracks = getComputedStyle(document.querySelector('.hero-grid')!).gridTemplateColumns.split(' ');
        const stage = box('.hero-stage');
        const copy = box('.hero-copy');
        return {
          stage: stage.width,
          column: parseFloat(tracks[1]!),
          // Positive: the copy's middle is below the stage's.
          offset: (copy.top + copy.bottom) / 2 - (stage.top + stage.bottom) / 2,
          cta: box('.hero .cta-row').bottom,
        };
      });
      expect(Math.abs(hero.stage - Math.min(640, hero.column))).toBeLessThanOrEqual(1);
      const spare = viewport.height - hero.cta;
      expect(spare).toBeGreaterThanOrEqual(24);
      if (centred) {
        expect(Math.abs(hero.offset)).toBeLessThanOrEqual(1);
      } else {
        expect(hero.offset).toBeLessThan(-1);
        expect(spare).toBeLessThanOrEqual(48);
      }
    });
  }

  test('1024x640, one column: the stage keeps the mockup size under the copy', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 640 });
    await openLanding(page);
    const stage = await page.evaluate(() => document.querySelector('.hero-stage')!.getBoundingClientRect().width);
    expect(Math.round(stage)).toBe(640);
  });
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

/** Records `scrollY` on every frame of each document the page loads (for at most a minute). */
function recordScroll(): void {
  const frames: number[] = [];
  Object.assign(window, { scrollFrames: frames });
  const sample = (): void => {
    frames.push(Math.round(window.scrollY));
    if (frames.length < 3600) {
      requestAnimationFrame(sample);
    }
  };
  requestAnimationFrame(sample);
}

const scrollFrames = (page: Page) =>
  page.evaluate(() => (window as unknown as { scrollFrames: number[] }).scrollFrames.slice());

/** Waits until the current document has recorded `count` frames. */
const recordedFrames = (page: Page, count: number) =>
  page.waitForFunction((count) => (window as unknown as { scrollFrames: number[] }).scrollFrames.length > count, count);

/** Frames that stand clearly between two positions: a glide has many, a jump none. */
const framesBetween = (frames: number[], from: number, to: number) =>
  frames.filter((y) => y > Math.min(from, to) + 100 && y < Math.max(from, to) - 100).length;

test.describe('scroll position on load (O8)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(recordScroll);
  });

  test('a reload in the middle of the page shows its place at once', async ({ page }) => {
    await openLanding(page);
    await page.evaluate(() => window.scrollTo({ top: 3200, behavior: 'instant' }));
    await page.waitForFunction(() => window.scrollY === 3200);
    await page.reload();
    await recordedFrames(page, 120);
    const frames = await scrollFrames(page);
    expect(Math.abs(frames[frames.length - 1]! - 3200)).toBeLessThanOrEqual(2);
    expect(framesBetween(frames, 0, 3200)).toBe(0);
  });

  test('an address with a #fragment shows its section at once, also after a reload', async ({ page }) => {
    for (const load of [() => page.goto('/#templates'), () => page.reload()]) {
      await load();
      await recordedFrames(page, 120);
      const frames = await scrollFrames(page);
      const end = frames[frames.length - 1]!;
      expect(end).toBeGreaterThan(1000);
      expect(framesBetween(frames, 0, end)).toBe(0);
    }
  });

  test('after a click an in-page jump still glides, and with reduced motion it jumps', async ({ page }) => {
    for (const reducedMotion of ['no-preference', 'reduce'] as const) {
      await page.emulateMedia({ reducedMotion });
      await openLanding(page);
      await page.evaluate(() => window.scrollTo({ top: 3200, behavior: 'instant' }));
      await page.waitForFunction(() => window.scrollY === 3200);
      const from = (await scrollFrames(page)).length;
      // The logo leads to #main, at the top of the page. A plain mouse click: the locator's click
      // first scrolls the sticky logo "into view", a jump of its own.
      const logo = (await page.locator('header a.logo').boundingBox())!;
      await page.mouse.click(logo.x + logo.width / 2, logo.y + logo.height / 2);
      await page.waitForFunction(() => window.scrollY < 100);
      const glide = framesBetween((await scrollFrames(page)).slice(from), 3200, 0);
      if (reducedMotion === 'reduce') {
        expect(glide, reducedMotion).toBe(0);
      } else {
        expect(glide, reducedMotion).toBeGreaterThan(5);
      }
    }
  });
});
