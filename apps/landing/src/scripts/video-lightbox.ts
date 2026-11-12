/**
 * Videos of the resources row play on the page, in a modal dialog, so the visitor does not leave
 * for YouTube. Nothing from YouTube loads before a click: the card shows a local thumbnail, and
 * the player (the privacy-enhanced youtube-nocookie.com domain) is created on open and removed on
 * close, which also stops the video.
 *
 * The controls are links to the video on YouTube, so without JavaScript they still lead to it.
 * With JavaScript they act as buttons that open the dialog.
 */

const embedUrl = (id: string): string =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;

export function initVideoLightbox(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-video-dialog]');
  const frame = dialog?.querySelector<HTMLElement>('[data-video-frame]');
  const close = dialog?.querySelector<HTMLButtonElement>('[data-video-close]');
  if (!dialog || !frame || !close) {
    return;
  }
  let opener: HTMLElement | null = null;

  const open = (control: HTMLElement): void => {
    const id = control.dataset['video'] ?? '';
    const title = control.dataset['videoTitle'] ?? 'Video';
    // Focus returns to the card's "Watch here", also when the thumbnail (hidden from assistive
    // technology) was clicked.
    opener =
      control.getAttribute('aria-hidden') === 'true'
        ? (control.closest('.tpl-card')?.querySelector<HTMLElement>('.links [data-video]') ?? control)
        : control;
    const player = document.createElement('iframe');
    player.src = embedUrl(id);
    player.title = title;
    player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    player.allowFullscreen = true;
    // YouTube refuses to play an embed that sends no referrer.
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.replaceChildren(player);
    dialog.setAttribute('aria-label', title);
    dialog.showModal();
    close.focus();
  };

  dialog.addEventListener('close', () => {
    frame.replaceChildren();
    opener?.focus();
    opener = null;
  });
  close.addEventListener('click', () => dialog.close());
  // A click on the dimmed area around the player closes it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  for (const control of document.querySelectorAll<HTMLAnchorElement>('a[data-video]')) {
    control.setAttribute('role', 'button');
    control.addEventListener('click', (event) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        return;
      }
      event.preventDefault();
      open(control);
    });
    // A button is pressed with Space too; a link would scroll the page instead.
    control.addEventListener('keydown', (event) => {
      if (event.key === ' ') {
        event.preventDefault();
        open(control);
      }
    });
  }
}
