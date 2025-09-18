import { inject, Injectable } from '@angular/core';
import { CursorPositionTrackerService } from '../../../../services/cursor-position-tracker/cursor-position-tracker.service';
import { BrowserInputsHelpers } from '../../../../services/input-events/browser-inputs-helpers';
import { InputEventsRouterService } from '../../../../services/input-events/input-events-router.service';
import { KeyboardAction } from './keyboard-action';

@Injectable()
export class PasteAction extends KeyboardAction {
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly cursorPositionTrackerService = inject(CursorPositionTrackerService);

  override matches(event: KeyboardEvent): boolean {
    return BrowserInputsHelpers.isKeyComboPressed('v', 'primary')(event);
  }

  override handle(event: KeyboardEvent): void {
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      name: 'paste',
      ...baseEvent,
      lastInputPoint: this.cursorPositionTrackerService.getLastPosition(),
    });
  }
}
