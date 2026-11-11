/**
 * The page's one polite live region (rendered by Layout.astro). It is emptied before each
 * message, so the same message twice in a row is read again, and emptied a while after, so a
 * stale message is not found later at the end of the page.
 */

const SPEAK_DELAY_MS = 100;
const CLEAR_AFTER_MS = 7000;

let speakTimer: ReturnType<typeof setTimeout> | undefined;
let clearTimer: ReturnType<typeof setTimeout> | undefined;

export function announce(message: string): void {
  const region = document.querySelector<HTMLElement>('[data-announcer]');
  if (!region) {
    return;
  }
  clearTimeout(speakTimer);
  clearTimeout(clearTimer);
  region.textContent = '';
  speakTimer = setTimeout(() => {
    region.textContent = message;
    clearTimer = setTimeout(() => (region.textContent = ''), CLEAR_AFTER_MS);
  }, SPEAK_DELAY_MS);
}
