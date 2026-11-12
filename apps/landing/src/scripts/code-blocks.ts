/**
 * Code blocks of the Quick Start: copy buttons, and a Tab stop on a block only while it
 * scrolls sideways (O9), so keyboard users can scroll it and nobody else gets an extra stop.
 */

import { announce } from './announce';

const COPIED_MS = 1600;

/** Re-checks whether a block scrolls sideways. Call it after changing the block's text. */
export function syncScrollable(pre: HTMLElement): void {
  if (pre.scrollWidth > pre.clientWidth) {
    pre.tabIndex = 0;
  } else {
    pre.removeAttribute('tabindex');
  }
}

const copyShortcut = (): string => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? 'Command+C' : 'Control+C');

const selectContents = (element: HTMLElement): void => {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
};

const initCopy = (button: HTMLButtonElement): void => {
  const target = document.querySelector<HTMLElement>(button.dataset['copy'] ?? '');
  const label = button.querySelector<HTMLElement>('[data-copy-text]');
  if (!target || !label) {
    return;
  }
  // The hidden end of the button's name: "install command", "styles import", "component code".
  const what = button.querySelector('.sr-only')?.textContent?.trim() || 'code';
  let reset: ReturnType<typeof setTimeout> | undefined;

  const showCopied = (copied: boolean): void => {
    button.classList.toggle('done', copied);
    label.textContent = copied ? 'Copied' : 'Copy';
  };

  button.addEventListener('click', async () => {
    clearTimeout(reset);
    showCopied(false);
    try {
      if (!navigator.clipboard) {
        throw new Error('The Clipboard API is not available.');
      }
      await navigator.clipboard.writeText(target.textContent ?? '');
    } catch {
      // Only a real copy says "Copied". Otherwise the code is selected for a manual copy.
      selectContents(target);
      announce(`Copying is blocked. The ${what} is selected: press ${copyShortcut()} to copy it.`);
      return;
    }
    showCopied(true);
    announce(`Copied the ${what}.`);
    reset = setTimeout(() => showCopied(false), COPIED_MS);
  });
};

export function initCodeBlocks(): void {
  const blocks = [...document.querySelectorAll<HTMLElement>('.code pre')];

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      syncScrollable(entry.target as HTMLElement);
    }
  });
  blocks.forEach((pre) => observer.observe(pre));
  // A web font swap changes the text width without resizing the block.
  void document.fonts.ready.then(() => blocks.forEach(syncScrollable));

  document.querySelectorAll<HTMLButtonElement>('button[data-copy]').forEach(initCopy);
}
