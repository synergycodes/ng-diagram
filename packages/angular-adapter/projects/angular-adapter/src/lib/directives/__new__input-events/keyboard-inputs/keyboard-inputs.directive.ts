import { Directive, inject } from '@angular/core';

import { CopyAction } from './keyboard-actions/copy.action';
import { DeleteSelectionAction } from './keyboard-actions/delete-selection.action';
import { MoveSelectionAction } from './keyboard-actions/move-selection.action';
import { PanWithArrowsAction } from './keyboard-actions/pan-with-arrows.action';
import { PasteAction } from './keyboard-actions/paste.action';

@Directive({
  selector: '[angularAdapterKeyboardInputs]',
  host: {
    '(document:keydown)': 'onKeyDown($event)',
  },
})
export class KeyboardInputsDirective {
  private readonly actions = [
    inject(PanWithArrowsAction),
    inject(MoveSelectionAction),
    inject(CopyAction),
    inject(PasteAction),
    inject(DeleteSelectionAction),
  ];

  onKeyDown(event: KeyboardEvent) {
    for (const action of this.actions) {
      if (action.matches(event)) {
        action.handle(event);
        break;
      }
    }
  }
}
