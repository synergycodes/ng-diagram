import { inject, Injectable } from '@angular/core';
import { BrowserInputsHelpers } from '../../../../services/input-events/browser-inputs-helpers';
import { InputEventsRouterService } from '../../../../services/input-events/input-events-router.service';
import { KeyboardAction } from './keyboard-action';

@Injectable({
  providedIn: 'root',
})
export class DeleteSelectionAction extends KeyboardAction {
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  override matches(event: KeyboardEvent): boolean {
    return BrowserInputsHelpers.isDeleteKeyPressed(event);
  }

  override handle(event: KeyboardEvent): void {
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      name: 'deleteSelection',
      ...baseEvent,
    });
  }
}
