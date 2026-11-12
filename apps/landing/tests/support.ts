import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/** Pages of the app; the layout, a11y and keyboard tests run on each. */
export const PAGES = ['/', '/contact'] as const;

/** WCAG tags of the axe checks. */
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Axe violations of the page in its current state, one line each. */
export async function axeViolations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  return results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`
  );
}

/** Widths of the layout and parity tests (CSS px). */
export const WIDTHS = [
  320, 360, 375, 390, 414, 480, 600, 720, 721, 768, 820, 900, 1024, 1025, 1100, 1280, 1366, 1440, 1920, 2560,
] as const;

/** Flex rows that must never overflow their box. */
export const BARS = ['.navbar', '.nav-main', '.tpl-tabs', '.pm-switch', '.cta-row', '.facts ul'] as const;

/** Values of `data-state` on the hero diagram host that end its loading. */
const SETTLED_STATES = ['live', 'failed', 'off'];

/** Opens the page and waits for web fonts, so measurements see the final text metrics. */
export async function openLanding(page: Page, path = '/'): Promise<void> {
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

/** Waits until the hero diagram finished loading (or will never load in this context). */
export async function waitForHeroSettled(page: Page, timeout = 20_000): Promise<string> {
  const media = await page.evaluate(() => {
    const host = document.querySelector<HTMLElement>('[data-hero-diagram]');
    return host ? window.matchMedia(host.dataset['media'] ?? '').matches : false;
  });
  if (!media) {
    return 'idle';
  }
  await page.waitForFunction(
    (states) => states.includes(document.querySelector<HTMLElement>('[data-hero-diagram]')?.dataset['state'] ?? ''),
    SETTLED_STATES,
    { timeout }
  );
  return page.evaluate(() => document.querySelector<HTMLElement>('[data-hero-diagram]')?.dataset['state'] ?? '');
}

export interface OverflowReport {
  /** Horizontal overflow of the page in px (0 = none). */
  page: number;
  /** Flex rows wider than their box: selector and overflow in px. */
  bars: string[];
}

/** Measures horizontal overflow of the page and of every visible bar in `BARS`. */
export function measureOverflow(page: Page): Promise<OverflowReport> {
  return page.evaluate(
    (bars) => {
      const root = document.documentElement;
      // Out-of-flow children (the closed menu panel) are not part of the row.
      const inFlow = (child: Element): boolean => {
        const style = getComputedStyle(child);
        return style.visibility !== 'hidden' && style.position !== 'absolute' && style.position !== 'fixed';
      };
      const report = { page: Math.max(0, root.scrollWidth - root.clientWidth), bars: [] as string[] };
      for (const selector of bars) {
        document.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
          if (!element.getClientRects().length) {
            return;
          }
          if (element.scrollWidth - element.clientWidth <= 1) {
            return;
          }
          // Content may reach into the padding of the bar's container (the menu button's hit area
          // does, by design), but not past the container's edge.
          const box = (element.parentElement ?? root).getBoundingClientRect();
          const spill = Math.max(
            0,
            ...[...element.children]
              .filter(inFlow)
              .flatMap((child) =>
                [...child.getClientRects()].map((rect) => Math.max(box.left - rect.left, rect.right - box.right))
              )
          );
          if (spill > 1) {
            report.bars.push(`${selector}[${index}] +${Math.round(spill)}px`);
          }
        });
      }
      return report;
    },
    BARS as unknown as string[]
  );
}

/** Words of the template tab names that the layout split across lines. */
export function brokenTabWords(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const broken: string[] = [];
    for (const name of document.querySelectorAll<HTMLElement>('.tpl-name')) {
      const text = name.firstChild;
      if (!(text instanceof Text) || !name.getClientRects().length) {
        continue;
      }
      const content = text.data;
      for (const match of content.matchAll(/\S+/g)) {
        const range = document.createRange();
        range.setStart(text, match.index);
        range.setEnd(text, match.index + match[0].length);
        const lines = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top)));
        if (lines.size > 1) {
          broken.push(match[0]);
        }
      }
      if (name.scrollWidth > name.clientWidth + 1) {
        broken.push(`${content} (clipped)`);
      }
    }
    return broken;
  });
}
