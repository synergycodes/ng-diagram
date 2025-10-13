import { Injectable, inject } from '@angular/core';
import { InputEventsRouterService } from '../../../../services/input-events/input-events-router.service';
import { KeyboardAction } from './keyboard-action';

@Injectable()
export class DeleteSelectionAction extends KeyboardAction {
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  override matches(event: KeyboardEvent): boolean {
    return this.inputEventsRouter.eventHelpers.isDeleteKeyPressed(event);
  }

  override handle(event: KeyboardEvent): void {
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      name: 'deleteSelection',
      ...baseEvent,
    });
  }
}
