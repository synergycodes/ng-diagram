import { Injectable } from '@angular/core';
import { InputEventsRouter } from '@angularflow/core';
import { BrowserInputsHelpers } from './browser-inputs-helpers';

type DomEvent = KeyboardEvent | WheelEvent | PointerEvent;

@Injectable({ providedIn: 'root' })
export class InputEventsRouterService extends InputEventsRouter {
  getBaseEvent(event: DomEvent) {
    return {
      modifiers: BrowserInputsHelpers.getModifiers(event),
      id: this.generateEventId(),
      timestamp: performance.now(),
    };
  }

  private generateEventId(): string {
    if (!crypto.randomUUID) {
      console.warn('crypto.randomUUID is not supported, using fallback ID generation');
      return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
    // NOTE: Works only in https
    return crypto.randomUUID();
  }
}
