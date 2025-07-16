import { Injectable } from '@angular/core';
import { __NEW__InputEventsRouter, __NEW__InputModifiers } from '@angularflow/core';
import { getOS } from '../flow-core-provider/detect-environment';

type DomEvent = KeyboardEvent | WheelEvent | PointerEvent;

@Injectable({ providedIn: 'root' })
export class InputEventsRouterService extends __NEW__InputEventsRouter {
  getBaseEvent(event: DomEvent) {
    return {
      modifiers: this.getModifiers(event),
      id: this.generateEventId(),
      timestamp: performance.now(),
    };
  }

  private getModifiers(event: DomEvent): __NEW__InputModifiers {
    const isMac = getOS() === 'MacOS';

    return {
      primary: isMac ? event.metaKey : event.ctrlKey,
      secondary: event.altKey,
      shift: event.shiftKey,
      meta: event.metaKey,
    };
  }

  private generateEventId(): string {
    // NOTE: Works only in https
    return crypto.randomUUID();
  }
}
