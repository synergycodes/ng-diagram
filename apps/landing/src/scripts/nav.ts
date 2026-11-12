/**
 * Menu button and panel, up to 64em (O1). While the panel is open the page behind it does not
 * scroll and is inert, so Tab stays in the header. Escape closes it and returns focus to the
 * button; a link in the header closes it; so does growing past the breakpoint (the same one as
 * in deviations/nav.css), which would otherwise leave the page locked.
 */

const DESKTOP_NAV = '(min-width: 64.0625em)';

export function initNav(): void {
  const header = document.querySelector<HTMLElement>('header');
  const toggle = header?.querySelector<HTMLButtonElement>('.nav-toggle');
  if (!header || !toggle) {
    return;
  }

  const behind = [...document.querySelectorAll<HTMLElement>('main, footer, .skip-main')];
  const isOpen = (): boolean => header.classList.contains('nav-open');

  const setOpen = (open: boolean): void => {
    header.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
    for (const element of behind) {
      element.inert = open;
    }
  };

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  // Runs before the link's own navigation, so an in-page target is no longer inert by then.
  header.addEventListener('click', (event) => {
    if (isOpen() && event.target instanceof Element && event.target.closest('a')) {
      setOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  window.matchMedia(DESKTOP_NAV).addEventListener('change', (event) => {
    if (event.matches && isOpen()) {
      setOpen(false);
    }
  });
}
