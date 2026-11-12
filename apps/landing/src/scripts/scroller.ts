/**
 * Paging rows (RowScroller.astro). The row is a real scroller, so the buttons only mirror what
 * wheel, trackpad, touch and the keyboard already do:
 *
 * - The position is read back from `scrollLeft` every time, never kept in a variable, so the
 *   buttons, a swipe and a Tab into a card further along all agree.
 * - The buttons page by the visible width. At either end the button is `aria-disabled` (it keeps
 *   its place in the Tab order) and does nothing.
 * - Once a scroll the visitor started settles, the position ("Templates 2–4 of 4") is announced
 *   through the page's live region, only when it changed.
 * - A card that receives focus is scrolled to the start, so the snap cannot leave it under the
 *   clipped edge (WCAG 2.4.11).
 *
 * Scroll behaviour (smooth, or instant with reduced motion) comes from the stylesheet.
 */
import { announce } from './announce';

const GAP = 20;
const SETTLE_MS = 150;

type Sync = () => void;
const syncs = new Map<HTMLElement, Sync>();

export function initScrollers(): void {
  for (const nav of document.querySelectorAll<HTMLElement>('[data-scroller-nav]')) {
    const scroller = document.getElementById(nav.dataset['scrollerNav'] ?? '');
    const [previous, next] = nav.querySelectorAll<HTMLButtonElement>('.nav-btn');
    if (!scroller || !previous || !next || syncs.has(scroller)) {
      continue;
    }
    const noun = nav.dataset['noun'] ?? 'Items';
    const total = scroller.querySelectorAll('.tpl-card').length;
    let spoken = '';

    const edges = (): void => {
      const max = scroller.scrollWidth - scroller.clientWidth;
      previous.setAttribute('aria-disabled', String(scroller.scrollLeft <= 1));
      next.setAttribute('aria-disabled', String(scroller.scrollLeft >= max - 1));
    };

    /**
     * "Templates 1–3 of 4", from the first card at the scroll position and the cards that fit;
     * "Templates 2 of 4" where one card fits (O17).
     */
    const position = (): string => {
      const card = scroller.querySelector<HTMLElement>('.tpl-card');
      if (!card || !scroller.clientWidth) {
        return '';
      }
      const step = card.offsetWidth + GAP;
      const first = Math.min(total, Math.round(scroller.scrollLeft / step) + 1);
      const last = Math.min(total, first + Math.max(1, Math.floor((scroller.clientWidth + GAP) / step)) - 1);
      return first === last ? `${noun} ${first} of ${total}` : `${noun} ${first}–${last} of ${total}`;
    };

    const settle = (): void => {
      const text = position();
      if (text && text !== spoken) {
        spoken = text;
        announce(text);
      }
    };

    for (const button of [previous, next]) {
      button.addEventListener('click', () => {
        if (button.getAttribute('aria-disabled') === 'true') {
          return;
        }
        scroller.scrollBy({ left: Number(button.dataset['dir']) * scroller.clientWidth });
      });
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    scroller.addEventListener(
      'scroll',
      () => {
        edges();
        if ('onscrollend' in scroller) {
          return;
        }
        clearTimeout(timer);
        timer = setTimeout(settle, SETTLE_MS);
      },
      { passive: true }
    );
    scroller.addEventListener('scrollend', settle);

    scroller.addEventListener('focusin', (event) => {
      const card = (event.target as Element).closest('.tpl-card');
      if (card && card !== event.target) {
        card.scrollIntoView({ block: 'nearest', inline: 'start' });
      }
    });

    // A hidden scroller measures 0, so its edges are read again whenever it may have changed:
    // on resize, and when its tab panel is shown (syncScrollers).
    const sync: Sync = () => {
      edges();
      spoken = position();
    };
    syncs.set(scroller, sync);
    sync();
    window.addEventListener('resize', sync, { passive: true });
  }
}

/** Measures the scrollers inside `root` again, e.g. after their tab panel was shown. */
export function syncScrollers(root: ParentNode): void {
  for (const [scroller, sync] of syncs) {
    if (root.contains(scroller)) {
      sync();
      // The browser restores the row's scroll position with the layout of the shown panel.
      requestAnimationFrame(sync);
    }
  }
}
