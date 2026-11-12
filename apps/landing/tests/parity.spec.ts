import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WIDTHS } from './support';

/**
 * Parity with the approved design mockup (local only: MOCKUP_PATH points at the mockup's HTML,
 * opened with `?clean`, which hides its annotations). Both pages run with the same local fonts,
 * reduced motion and a classic scrollbar; the mockup's external hosts and its diagram widget are
 * blocked and the landing's island is held back, so both show an empty stage. Every difference
 * must be covered by an entry of DEVIATIONS.md.
 */

const MOCKUP_PATH = process.env['MOCKUP_PATH'];
const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const REPORT_DIR = join(here, '..', 'reports', 'parity');

export const SECTIONS = [
  'header',
  '.hero',
  '.facts',
  '.whatis',
  '.native-sec',
  '.qs',
  '.agent',
  '.tpl',
  '.tpl-ask',
  '.ex',
  '.res',
  '.services',
  '.talk',
  '.voices',
  '.quad-sec',
  '.comm',
  '.faq-sec',
  'footer',
] as const;
type Section = (typeof SECTIONS)[number];

/** Elements compared inside each section, by index, relative to the section's top left. */
const PROBES = 'h1, h2, h3, p, .btn, .num, .tpl-card, .tpl-tab, .pm-seg, .code, li, img, blockquote';

/** Computed styles compared for the first match of each selector. */
const STYLE_PROBES = [
  'body',
  'h1',
  '.hero .lead',
  'h2',
  '.sec-head .lead',
  '.hero .btn-primary',
  '.hero .btn-secondary',
  'h3',
  '.code pre',
];
const STYLE_PROPERTIES = ['font-size', 'line-height', 'font-weight', 'letter-spacing', 'color', 'background-color'];

const FONT_FILES: Record<string, string> = {
  'roboto-400': '@fontsource/roboto/files/roboto-latin-400-normal.woff2',
  'roboto-500': '@fontsource/roboto/files/roboto-latin-500-normal.woff2',
  'roboto-700': '@fontsource/roboto/files/roboto-latin-700-normal.woff2',
  'roboto-mono-400': '@fontsource/roboto-mono/files/roboto-mono-latin-400-normal.woff2',
  'roboto-mono-500': '@fontsource/roboto-mono/files/roboto-mono-latin-500-normal.woff2',
};
const FONT_CSS = Object.keys(FONT_FILES)
  .map((key) => {
    const [, mono, weight] = /^roboto(-mono)?-(\d+)$/.exec(key)!;
    return `@font-face{font-family:'${mono ? 'Roboto Mono' : 'Roboto'}';font-weight:${weight};font-style:normal;font-display:swap;src:url(https://fonts.parity.test/${key}.woff2) format('woff2');}`;
  })
  .join('\n');

/** The mockup's address: `?clean` hides its annotations and highlights. */
const mockupUrl = (): string => `${pathToFileURL(MOCKUP_PATH!).href}?clean`;

/**
 * Serves the mockup's Google Fonts from the same local files the landing uses and blocks the rest.
 * Its diagram widget loads from local files, which routes cannot block, so the element is never
 * defined: the stage stays empty, as the landing's with its island held back.
 */
async function routeMockup(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    const define = customElements.define.bind(customElements);
    customElements.define = (name, constructor, options) =>
      name === 'ng-diagram-widget' ? undefined : define(name, constructor, options);
  });
  await context.route(/^https?:\/\//, async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'fonts.googleapis.com') {
      return route.fulfill({ contentType: 'text/css', body: FONT_CSS });
    }
    if (url.hostname === 'fonts.parity.test') {
      const key = url.pathname.replace(/^\/|\.woff2$/g, '');
      return route.fulfill({ contentType: 'font/woff2', body: readFileSync(require.resolve(FONT_FILES[key]!)) });
    }
    return route.abort();
  });
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Measurement {
  sections: Record<string, { height: number; probes: { key: string; box: Box }[] } | null>;
  styles: Record<string, Record<string, string> | null>;
}

function measure(page: Page): Promise<Measurement> {
  return page.evaluate(
    ({ sections, probes, styleProbes, properties }) => {
      const round = (value: number) => Math.round(value * 2) / 2;
      const result: Measurement = { sections: {}, styles: {} };
      for (const selector of sections) {
        const section = document.querySelector(selector);
        if (!section) {
          result.sections[selector] = null;
          continue;
        }
        const origin = section.getBoundingClientRect();
        result.sections[selector] = {
          height: round(origin.height),
          probes: [...section.querySelectorAll(probes)]
            .filter((element) => element.getClientRects().length && !element.closest('[hidden], .sr-only, .nav-menu'))
            .map((element) => {
              const box = element.getBoundingClientRect();
              return {
                key: `${element.tagName.toLowerCase()}.${[...element.classList].join('.')}`,
                box: {
                  x: round(box.left - origin.left),
                  y: round(box.top - origin.top),
                  w: round(box.width),
                  h: round(box.height),
                },
              };
            }),
        };
      }
      for (const selector of styleProbes) {
        const element = document.querySelector(selector);
        if (!element) {
          result.styles[selector] = null;
          continue;
        }
        const style = getComputedStyle(element);
        result.styles[selector] = Object.fromEntries(properties.map((name) => [name, style.getPropertyValue(name)]));
      }
      return result;
    },
    { sections: [...SECTIONS], probes: PROBES, styleProbes: STYLE_PROBES, properties: STYLE_PROPERTIES }
  ) as Promise<Measurement>;
}

/** What a difference is about, for the allow-list. */
export interface Difference {
  section: Section | 'styles';
  kind: 'height' | 'probes' | 'missing' | 'style';
  detail: string;
}

function compare(mockup: Measurement, landing: Measurement): Difference[] {
  const differences: Difference[] = [];
  for (const section of SECTIONS) {
    const a = mockup.sections[section];
    const b = landing.sections[section];
    if (!a || !b) {
      differences.push({ section, kind: 'missing', detail: `mockup ${!!a}, landing ${!!b}` });
      continue;
    }
    if (Math.abs(a.height - b.height) > 1) {
      differences.push({ section, kind: 'height', detail: `${a.height} → ${b.height}` });
    }
    const keysA = a.probes.map((probe) => probe.key).join(' ');
    const keysB = b.probes.map((probe) => probe.key).join(' ');
    if (keysA !== keysB) {
      differences.push({
        section,
        kind: 'probes',
        detail: `structure: ${a.probes.length} → ${b.probes.length} elements`,
      });
      continue;
    }
    const moved = a.probes
      .map((probe, index) => {
        const other = b.probes[index]!.box;
        const delta = Math.max(
          Math.abs(probe.box.x - other.x),
          Math.abs(probe.box.y - other.y),
          Math.abs(probe.box.w - other.w),
          Math.abs(probe.box.h - other.h)
        );
        return delta > 1 ? `${probe.key}#${index} ${JSON.stringify(probe.box)} → ${JSON.stringify(other)}` : null;
      })
      .filter(Boolean);
    if (moved.length) {
      differences.push({ section, kind: 'probes', detail: `${moved.length} moved; first: ${moved[0]}` });
    }
  }
  for (const selector of STYLE_PROBES) {
    const a = mockup.styles[selector];
    const b = landing.styles[selector];
    for (const property of STYLE_PROPERTIES) {
      if (a?.[property] !== b?.[property]) {
        differences.push({
          section: 'styles',
          kind: 'style',
          detail: `${selector} ${property}: ${a?.[property]} → ${b?.[property]}`,
        });
      }
    }
  }
  return differences;
}

/**
 * Differences the deviation register allows, by section and width. Each entry names its
 * register item; anything else fails the test.
 */
interface Rule {
  register: string;
  section: Difference['section'];
  kinds?: Difference['kind'][];
  /** Inclusive range of widths; every width when absent. */
  widths?: [number, number];
}

const RULES: Rule[] = [
  // "Talk to the team" sits in the bar, outside the menu panel, on every width.
  { register: 'O1', section: 'header', kinds: ['probes'] },
  // Menu button and panel up to 64em instead of the three-line bar.
  { register: 'O1', section: 'header', kinds: ['height'], widths: [721, 1024] },
  // The facts strip is a list.
  { register: 'O9', section: '.facts', kinds: ['probes'] },
  // No StackBlitz button until the project exists; on phones the buttons stack.
  { register: 'O3', section: '.qs', kinds: ['probes'] },
  { register: 'O3', section: '.qs', kinds: ['height'], widths: [0, 720] },
  // The phone stage takes the proportions of the still instead of 4:3.
  { register: 'O7', section: '.hero', kinds: ['height'], widths: [0, 720] },
  // The five real templates, two domains (no Workflow tab), no placeholders.
  { register: 'O2', section: '.tpl' },
  // Top padding of .native-sec on phones.
  { register: 'O6', section: '.native-sec', widths: [0, 720] },
  // "Ask the ngDiagram team" leads to a page of this site: same tab, no arrow.
  { register: 'O10', section: '.tpl-ask', kinds: ['probes'] },
  // The kind, source and length of a resource stand under its description.
  { register: 'O15', section: '.res' },
  // FAQ answers are at most 72ch wide.
  { register: 'O15', section: '.faq-sec', kinds: ['probes'] },
  // Claims the repository backs are shorter than the mockup's: fewer lines on narrow screens.
  { register: 'O16', section: '.facts', kinds: ['height'] },
  { register: 'O16', section: '.whatis' },
  { register: 'O16', section: '.quad-sec' },
  // The team photo is an image in the photo cell (it loads lazily), not the cell's background.
  { register: 'O11', section: '.services', kinds: ['probes'] },
  // Footer links are at least 24px tall.
  { register: 'O10', section: 'footer', kinds: ['height'] },
];

export function allowed(difference: Difference, width: number): string | null {
  const rule = RULES.find(
    (candidate) =>
      candidate.section === difference.section &&
      (!candidate.kinds || candidate.kinds.includes(difference.kind)) &&
      (!candidate.widths || (width >= candidate.widths[0] && width <= candidate.widths[1]))
  );
  return rule?.register ?? null;
}

test.describe('parity with the mockup', () => {
  test.skip(!MOCKUP_PATH, 'Set MOCKUP_PATH to the mockup HTML to run the parity test.');

  for (const width of WIDTHS) {
    test(`${width}px`, async ({ browser }) => {
      const viewport = { width, height: 900 };
      const mockupContext = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      await routeMockup(mockupContext);
      const mockup = await mockupContext.newPage();
      await mockup.goto(mockupUrl());
      await mockup.evaluate(() => document.fonts.ready.then(() => undefined));

      const landingContext = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      // Hold the island: the stage stays empty, as in the mockup without its widget.
      await landingContext.route(/\/_landing\/bootstrap\.[^/]*\.js$/, () => undefined);
      const landing = await landingContext.newPage();
      await landing.goto('/');
      await landing.evaluate(() => document.fonts.ready.then(() => undefined));

      const differences = compare(await measure(mockup), await measure(landing));
      const unexplained = differences.filter((difference) => !allowed(difference, width));

      mkdirSync(REPORT_DIR, { recursive: true });
      writeFileSync(
        join(REPORT_DIR, `${width}.json`),
        JSON.stringify(
          differences.map((d) => ({ ...d, allowedBy: allowed(d, width) })),
          null,
          2
        )
      );
      if ([390, 768, 1440].includes(width)) {
        for (const section of SECTIONS) {
          for (const [name, page] of [
            ['mockup', mockup],
            ['landing', landing],
          ] as const) {
            const element = page.locator(section).first();
            if (await element.count()) {
              await element.screenshot({
                path: join(REPORT_DIR, `${width}`, `${section.replace(/\W/g, '')}-${name}.png`),
              });
            }
          }
        }
      }

      await mockupContext.close();
      await landingContext.close();
      expect(unexplained.map((d) => `${d.section} ${d.kind}: ${d.detail}`)).toEqual([]);
    });
  }
});

/** Boxes of `selector` matches relative to the viewport, rounded to half pixels. */
const boxes = (page: Page, selector: string) =>
  page.$$eval(selector, (elements) =>
    elements
      .filter((element) => element.getClientRects().length)
      .map((element) => {
        const box = element.getBoundingClientRect();
        const round = (value: number) => Math.round(value * 2) / 2;
        return `${round(box.left)},${round(box.top)} ${round(box.width)}x${round(box.height)}`;
      })
  );

async function openPair(browser: import('@playwright/test').Browser, width: number) {
  const viewport = { width, height: 900 };
  const mockupContext = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  await routeMockup(mockupContext);
  const mockup = await mockupContext.newPage();
  await mockup.goto(mockupUrl());
  await mockup.evaluate(() => document.fonts.ready.then(() => undefined));
  const landingContext = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  await landingContext.route(/\/_landing\/bootstrap\.[^/]*\.js$/, () => undefined);
  const landing = await landingContext.newPage();
  await landing.goto('/');
  await landing.evaluate(() => document.fonts.ready.then(() => undefined));
  return {
    mockup,
    landing,
    close: async () => {
      await mockupContext.close();
      await landingContext.close();
    },
  };
}

test.describe('parity of states', () => {
  test.skip(!MOCKUP_PATH, 'Set MOCKUP_PATH to the mockup HTML to run the parity test.');

  for (const width of [320, 390, 720]) {
    test(`${width}px: open menu`, async ({ browser }) => {
      const pair = await openPair(browser, width);
      for (const page of [pair.mockup, pair.landing]) {
        await page.click('.nav-toggle');
        await expect(page.locator('header')).toHaveClass(/nav-open/);
      }
      // The mockup animates its panel even with reduced motion (O8): let the transition end.
      await pair.mockup.waitForTimeout(700);
      // The links of the panel; the mockup's panel also holds the CTA, which O1 keeps in the bar.
      for (const selector of ['.nav-menu .nav-main a', '.nav-menu .nav-ext a']) {
        expect(await boxes(pair.landing, selector), selector).toEqual(await boxes(pair.mockup, selector));
      }
      await pair.close();
    });
  }

  // The template tabs are not compared: the landing has two domains where the mockup has three (O2).
  for (const width of [390, 768, 1440]) {
    test(`${width}px: every package manager`, async ({ browser }) => {
      const pair = await openPair(browser, width);
      for (const pm of ['npm', 'pnpm', 'yarn', 'bun']) {
        const results: string[] = [];
        for (const page of [pair.mockup, pair.landing]) {
          await page.locator(`.pm-seg[data-pm="${pm}"]`).click();
          const code = await page.locator('#installCode').textContent();
          const segment = await page.locator('.pm-switch').boundingBox();
          results.push(`${code} ${Math.round(segment!.width)}x${Math.round(segment!.height)}`);
        }
        expect(results[1], pm).toBe(results[0]);
      }
      await pair.close();
    });
  }
});
