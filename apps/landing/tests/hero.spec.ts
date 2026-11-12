import { expect, test, type Page } from '@playwright/test';
import { openLanding, waitForHeroSettled } from './support';

/** Requests that belong to the hero island (its lazy JS chunk and anything it pulls in). */
const ISLAND = /\/_landing\/bootstrap\.[^/]*\.js$|hero-diagram|uPlot|ng-diagram/i;
/** The island's lazy JS chunk. */
const ISLAND_CHUNK = /\/_landing\/bootstrap\.[^/]*\.js$/;

/** Holds the island's chunk until the returned function is called. */
async function holdIsland(page: Page): Promise<() => void> {
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route(ISLAND_CHUNK, async (route) => {
    await held;
    await route.continue();
  });
  return release;
}

const SKETCH_DRIFT =
  'The loading sketch no longer matches the live diagram: build, start the preview and run `pnpm --filter landing sketch:capture`';

/** Largest distance in px between a node card of the loading sketch and the same live node. */
const sketchOffset = (page: Page) =>
  page.evaluate(() => {
    const sketch = new Map(
      [...document.querySelectorAll<SVGGElement>('[data-sketch-node]')].map((node) => [
        node.dataset['sketchNode'],
        node.querySelector('.sk-card')!.getBoundingClientRect(),
      ])
    );
    const live = [...document.querySelectorAll<HTMLElement>('ng-diagram-node')];
    if (!live.length || live.length !== sketch.size) {
      return Infinity;
    }
    return Math.max(
      ...live.map((node) => {
        const a = node.getBoundingClientRect();
        const b = sketch.get(node.dataset['nodeId']);
        return b
          ? Math.max(
              Math.abs(a.left - b.left),
              Math.abs(a.top - b.top),
              Math.abs(a.right - b.right),
              Math.abs(a.bottom - b.bottom)
            )
          : Infinity;
      })
    );
  });

/** Animations running on elements of the loading sketch. */
const sketchAnimations = (page: Page) =>
  page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((animation) => (animation.effect as KeyframeEffect | null)?.target?.closest('.hero-sketch')).length
  );

/** Union of the node boxes against the stage box, both in viewport px. */
const nodesInStage = (page: Page) =>
  page.evaluate(() => {
    const stage = document.querySelector('.hero-stage')!.getBoundingClientRect();
    const boxes = [...document.querySelectorAll('ng-diagram-node')].map((node) => node.getBoundingClientRect());
    const nodes = {
      left: Math.min(...boxes.map((box) => box.left)),
      top: Math.min(...boxes.map((box) => box.top)),
      right: Math.max(...boxes.map((box) => box.right)),
      bottom: Math.max(...boxes.map((box) => box.bottom)),
    };
    return {
      count: boxes.length,
      // Positive = the nodes stay inside the stage on that side.
      left: nodes.left - stage.left,
      top: nodes.top - stage.top,
      right: stage.right - nodes.right,
      bottom: stage.bottom - nodes.bottom,
    };
  });

const TOLERANCE = 2;

/** Whether the stage shows the still image of the diagram (slot `heroStill`). */
const stillShown = (page: Page) =>
  page
    .locator('.hero-stage')
    .evaluate(
      (stage) => stage.getClientRects().length > 0 && getComputedStyle(stage).backgroundImage.includes('hero-still')
    );

/** First and last glyph of `selector`'s text, in viewport px. */
const textEnds = (page: Page, selector: string) =>
  page.evaluate((selector) => {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector(selector)!);
    const rects = [...range.getClientRects()];
    const first = rects[0]!;
    const last = rects[rects.length - 1]!;
    return {
      first: { x: first.left + 2, y: first.top + first.height / 2 },
      last: { x: last.right - 2, y: last.top + last.height / 2 },
    };
  }, selector);

/** What a pointer reaches on the first glyph of `selector`: its text, the diagram host, or another element. */
const pointerTarget = (page: Page, selector: string) =>
  page.evaluate((selector) => {
    const element = document.querySelector(selector)!;
    const range = document.createRange();
    range.selectNodeContents(element);
    const line = range.getClientRects()[0]!;
    const target = document.elementFromPoint(line.left + 2, line.top + line.height / 2);
    if (target?.closest('[data-hero-diagram]')) {
      return 'diagram';
    }
    return target && element.contains(target) ? 'text' : String(target?.nodeName);
  }, selector);

/** The page's selection with white space collapsed. */
const selectedText = (page: Page) => page.evaluate(() => String(window.getSelection()).replace(/\s+/g, ' ').trim());

const textOf = async (page: Page, selector: string) =>
  ((await page.locator(selector).textContent()) ?? '').replace(/\s+/g, ' ').trim();

async function expectNodesInStage(page: Page): Promise<void> {
  await expect
    .poll(async () => {
      const fit = await nodesInStage(page);
      return fit.count > 0 && Math.min(fit.left, fit.top, fit.right, fit.bottom) >= -TOLERANCE;
    })
    .toBe(true);
}

test('1440px: the diagram goes live and stays anchored to the stage across resizes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openLanding(page);
  expect(await waitForHeroSettled(page)).toBe('live');
  await expectNodesInStage(page);

  for (const width of [1100, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expectNodesInStage(page);
  }
});

test('loading the island changes nothing else on the page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // Hold the island's chunk until the page has been measured without it.
  const release = await holdIsland(page);

  const snapshot = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('body *')]
        .filter((element) => !element.closest('[data-hero-diagram]') && !(element instanceof HTMLStyleElement))
        .map((element) => {
          const box = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return [
            element.tagName,
            element.className,
            Math.round(box.x),
            Math.round(box.y),
            Math.round(box.width),
            Math.round(box.height),
            style.color,
            style.backgroundColor,
            style.fontFamily,
            style.fontSize,
          ].join('|');
        })
    );

  await openLanding(page);
  await expect(page.locator('[data-hero-diagram]')).toHaveAttribute('data-state', 'loading');
  const before = await snapshot();
  release();
  expect(await waitForHeroSettled(page)).toBe('live');
  const after = await snapshot();
  expect(after.filter((entry, index) => entry !== before[index])).toEqual([]);
});

for (const scenario of [
  { name: '390px phone', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
  { name: 'touch tablet (1194x834)', viewport: { width: 1194, height: 834 }, hasTouch: true, isMobile: true },
  { name: 'short desktop window (1280x500)', viewport: { width: 1280, height: 500 }, hasTouch: false, isMobile: false },
]) {
  test(`${scenario.name}: no island requests, the still stands in and no sketch (O7)`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: scenario.viewport,
      hasTouch: scenario.hasTouch,
      isMobile: scenario.isMobile,
    });
    const page = await context.newPage();
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));

    await openLanding(page);
    const media = await page.evaluate(
      () => window.matchMedia(document.querySelector<HTMLElement>('[data-hero-diagram]')!.dataset['media']!).matches
    );
    expect(media).toBe(false);
    // Past the loader's idle timeout (3s).
    await page.waitForTimeout(3500);

    expect(requests.filter((url) => ISLAND.test(url))).toEqual([]);
    await expect(page.locator('[data-hero-diagram]')).toHaveAttribute('data-state', 'idle');
    expect(await stillShown(page)).toBe(true);
    await expect(page.locator('.hero-sketch')).toBeHidden();
    await context.close();
  });
}

test('a failed island load leaves the page working, with the still in the stage', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route(ISLAND_CHUNK, (route) => route.abort());
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await openLanding(page);
  expect(await waitForHeroSettled(page)).toBe('failed');
  expect(await stillShown(page)).toBe(true);
  await expect(page.locator('.hero-sketch')).toBeHidden();
  expect(errors).toEqual([]);
  // The rest of the page still runs its scripts.
  await page.locator('.pm-seg[data-pm="pnpm"]').click();
  await expect(page.locator('#installCode')).toHaveText('pnpm add ng-diagram');
});

test('the loading sketch fills the stage until the live diagram lands on it (O13)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const release = await holdIsland(page);
  await openLanding(page);
  await expect(page.locator('[data-hero-diagram]')).toHaveAttribute('data-state', 'loading');
  await expect(page.locator('.hero-sketch')).toBeVisible();
  expect(await sketchAnimations(page)).toBeGreaterThan(0);
  // Where the live diagram runs, the still never shows (O7).
  expect(await stillShown(page)).toBe(false);

  release();
  expect(await waitForHeroSettled(page)).toBe('live');
  await expect(page.locator('.hero-sketch')).toBeHidden();
  // Hidden, but still laid out: the same boxes as the live nodes, also after the stage resizes.
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1100, height: 800 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => sketchOffset(page), { message: SKETCH_DRIFT }).toBeLessThanOrEqual(1);
  }
});

test('reduced motion: the loading sketch holds still and goes at once (O13)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const release = await holdIsland(page);
  await openLanding(page);
  await expect(page.locator('.hero-sketch')).toBeVisible();
  expect(await sketchAnimations(page)).toBe(0);
  expect(await page.locator('.hero-sketch').evaluate((sketch) => getComputedStyle(sketch).transitionDuration)).toBe(
    '0s'
  );
  release();
  expect(await waitForHeroSettled(page)).toBe('live');
  await expect(page.locator('.hero-sketch')).toBeHidden();
});

test('forced colours: no loading sketch (O13)', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, forcedColors: 'active' });
  const page = await context.newPage();
  await holdIsland(page);
  await openLanding(page);
  await expect(page.locator('.hero-stage')).toBeVisible();
  await expect(page.locator('.hero-sketch')).toBeHidden();
  await context.close();
});

test('1440px without JavaScript: the still stands in, no sketch (O7)', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.hero-copy h1')).toBeVisible();
  expect(await stillShown(page)).toBe(true);
  await expect(page.locator('.hero-sketch')).toBeHidden();
  await context.close();
});

test('390px: the stage takes the proportions of the still (O7)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLanding(page);
  const { ratio, stage } = await page.evaluate(() => {
    const element = document.querySelector<HTMLElement>('.hero-stage')!;
    const [width, height] = getComputedStyle(element).getPropertyValue('--hero-shot-ratio').split('/').map(Number);
    const box = element.getBoundingClientRect();
    return { ratio: width! / height!, stage: box.width / box.height };
  });
  expect(Math.abs(stage - ratio)).toBeLessThan(0.01);
});

test('1440px: the headline and the lead can be selected over the live diagram, which keeps its drags (O4)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openLanding(page);
  expect(await waitForHeroSettled(page)).toBe('live');

  for (const selector of ['.hero-copy h1', '.hero .lead']) {
    expect(await pointerTarget(page, selector), selector).toBe('text');
  }
  // Between the headline and the lead the pointer still reaches the diagram.
  const gap = await page.evaluate(() => {
    const headline = document.querySelector('.hero-copy h1')!.getBoundingClientRect();
    const lead = document.querySelector('.hero .lead')!.getBoundingClientRect();
    return !!document
      .elementFromPoint(headline.left + 2, (headline.bottom + lead.top) / 2)
      ?.closest('[data-hero-diagram]');
  });
  expect(gap).toBe(true);

  // A mouse drag over the headline selects it; a triple click selects the lead.
  const headline = await textEnds(page, '.hero-copy h1');
  await page.mouse.move(headline.first.x, headline.first.y);
  await page.mouse.down();
  await page.mouse.move(headline.last.x, headline.last.y, { steps: 12 });
  await page.mouse.up();
  expect(await selectedText(page)).toBe(await textOf(page, '.hero-copy h1'));

  const lead = await textEnds(page, '.hero .lead');
  await page.mouse.click(lead.first.x, lead.first.y, { clickCount: 3 });
  expect(await selectedText(page)).toBe(await textOf(page, '.hero .lead'));

  // A node dragged over the headline follows the pointer and stays where it is released.
  await page.evaluate(() => window.getSelection()?.removeAllRanges());
  const node = page.locator('ng-diagram-node[data-node-id="proceed-if-true"]');
  const before = (await node.boundingBox())!;
  // Its header, clear of the ports on its sides.
  const grab = { x: before.x + before.width / 2, y: before.y + 30 };
  const box = (await page.locator('.hero-copy h1').boundingBox())!;
  const drop = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.mouse.move(grab.x, grab.y);
  await page.mouse.down();
  await page.mouse.move(drop.x, drop.y, { steps: 20 });
  await page.mouse.up();
  const after = (await node.boundingBox())!;
  expect(Math.abs(after.x - before.x - (drop.x - grab.x))).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(after.y - before.y - (drop.y - grab.y))).toBeLessThanOrEqual(TOLERANCE);
  await page.mouse.move(drop.x + 80, drop.y + 40, { steps: 4 });
  const moved = (await node.boundingBox())!;
  expect(Math.abs(moved.x - after.x) + Math.abs(moved.y - after.y)).toBeLessThanOrEqual(TOLERANCE);
  expect(await selectedText(page)).toBe('');
});

test('390px phone: the headline and the lead take the pointer, not the diagram host (O4)', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await openLanding(page);
  for (const selector of ['.hero-copy h1', '.hero .lead']) {
    expect(await pointerTarget(page, selector), selector).toBe('text');
  }
  await context.close();
});
