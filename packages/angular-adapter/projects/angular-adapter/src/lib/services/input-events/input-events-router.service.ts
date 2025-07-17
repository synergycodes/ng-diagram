import { Injectable } from '@angular/core';
import { __NEW__InputEventsRouter } from '@angularflow/core';
import { BrowserInputsHelpers } from './browser-inputs-helpers';

type DomEvent = KeyboardEvent | WheelEvent | PointerEvent;

@Injectable({ providedIn: 'root' })
export class InputEventsRouterService extends __NEW__InputEventsRouter {
  getBaseEvent(event: DomEvent) {
    return {
      modifiers: BrowserInputsHelpers.getModifiers(event),
      id: this.generateEventId(),
      timestamp: performance.now(),
    };
  }

  private generateEventId(): string {
    // NOTE: Works only in https
    return crypto.randomUUID();
  }
}
