import { inject, Injectable } from '@angular/core';
import { Direction } from '@angularflow/core';
import { BrowserInputsHelpers } from '../../../../services/input-events/browser-inputs-helpers';
import { InputEventsRouterService } from '../../../../services/input-events/input-events-router.service';

import { FlowCoreProviderService } from '../../../../services/flow-core-provider/flow-core-provider.service';
import { KeyboardAction } from './keyboard-action';

@Injectable({
  providedIn: 'root',
})
export class PanWithArrowsAction extends KeyboardAction {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly inputEventsRouter = inject(InputEventsRouterService);

  matches(event: KeyboardEvent): boolean {
    if (!!this.flowCoreProvider.provide().modelLookup.getSelectedNodes().length) {
      return false;
    }

    return BrowserInputsHelpers.isArrowKeyPressed(event);
  }

  handle(event: KeyboardEvent): void {
    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'keyboard-panning',
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
        throw new Error(`Unsupported key for panning: ${event.key}`);
    }
  }
}
