import { Directive, inject } from '@angular/core';

import { type InputEventName } from '../../../../core/src';
import { FlowCoreProviderService } from '../../../services/flow-core-provider/flow-core-provider.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { MovingAction } from './keyboard-actions/moving.action';
import { PanningAction } from './keyboard-actions/panning.action';
import { PasteAction } from './keyboard-actions/paste.action';

@Directive({
  selector: '[ngDiagramKeyboardInputs]',
  standalone: true,
  providers: [PanningAction, MovingAction, PasteAction],
  host: {
    '(document:keydown)': 'onKeyDown($event)',
  },
})
export class KeyboardInputsDirective {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly keyboardActions = [inject(PanningAction), inject(MovingAction), inject(PasteAction)];

  onKeyDown(event: KeyboardEvent): void {
    const flowCore = this.flowCoreProvider.provide();
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);

    const shortcuts = flowCore.shortcutManager.match({
      key: event.key,
      modifiers: baseEvent.modifiers,
    });

    if (shortcuts.length === 0) {
      return;
    }

    event.preventDefault();

    for (const shortcut of shortcuts) {
      const matchingAction = this.keyboardActions.find((action) => action.canHandle(shortcut, flowCore));
      const event = matchingAction
        ? matchingAction.createEvent(shortcut, baseEvent)
        : {
            ...baseEvent,
            name: shortcut.actionName as InputEventName,
          };

      if (event) {
        this.inputEventsRouter.emit(event);
      }
    }
  }
}
