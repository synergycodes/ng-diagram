import { Injectable, inject } from '@angular/core';
import type { Direction } from '../../../../../core/src';
import { FlowCoreProviderService } from '../../../../services';
import { InputEventsRouterService } from '../../../../services/input-events/input-events-router.service';
import { KeyboardAction } from './keyboard-action';

@Injectable()
export class MoveSelectionAction extends KeyboardAction {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  matches(event: KeyboardEvent): boolean {
    if (!this.flowCoreProvider.provide().modelLookup.getSelectedNodes().length) {
      return false;
    }

    return this.inputEventsRouter.eventHelpers.isArrowKeyPressed(event);
  }

  handle(event: KeyboardEvent): void {
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'keyboardMoveSelection',
      direction: this.getDirection(event),
    });
  }

  private getDirection(event: KeyboardEvent): Direction {
    switch (event.key) {
      case 'ArrowUp':
        return 'top';
      case 'ArrowDown':
        return 'bottom';
      case 'ArrowLeft':
        return 'left';
      case 'ArrowRight':
        return 'right';
      default:
        throw new Error(`Unsupported key for moving selection: ${event.key}`);
    }
  }
}
