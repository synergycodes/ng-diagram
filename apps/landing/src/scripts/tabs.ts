/**
 * Template domain tabs. The server renders the tablist with the first tab selected and the
 * other panels hidden; without JavaScript the tablist is hidden and every panel is shown
 * (noscript styles in Layout.astro).
 */

import { HORIZONTAL, rovingGroup, setRovingSelection } from './roving';
import { syncScrollers } from './scroller';

export function initTabs(): void {
  for (const list of document.querySelectorAll<HTMLElement>('[role="tablist"]')) {
    const tabs = [...list.querySelectorAll<HTMLElement>('[role="tab"]')];

    const select = (selected: HTMLElement): void => {
      setRovingSelection(tabs, selected, 'aria-selected');
      for (const tab of tabs) {
        const panel = document.getElementById(tab.getAttribute('aria-controls') ?? '');
        if (panel) {
          panel.hidden = tab !== selected;
          if (!panel.hidden) {
            // A row in a panel that was hidden measured 0: its buttons read the edges again.
            syncScrollers(panel);
          }
        }
      }
    };

    rovingGroup(tabs, select, HORIZONTAL);
  }
}
