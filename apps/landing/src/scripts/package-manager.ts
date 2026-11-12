/**
 * Package manager segment (a radiogroup). Without JavaScript it is hidden and the block shows
 * the npm command rendered by the server.
 */

import { syncScrollable } from './code-blocks';
import { BOTH_AXES, rovingGroup, setRovingSelection } from './roving';

export function initPackageManager(): void {
  const group = document.querySelector<HTMLElement>('.pm-switch');
  const code = document.getElementById('installCode');
  if (!group || !code) {
    return;
  }
  const segments = [...group.querySelectorAll<HTMLElement>('[role="radio"]')];

  const select = (selected: HTMLElement): void => {
    setRovingSelection(segments, selected, 'aria-checked');
    const command = selected.dataset['command'];
    if (command) {
      code.textContent = command;
      syncScrollable(code);
    }
  };

  rovingGroup(segments, select, BOTH_AXES);
}
