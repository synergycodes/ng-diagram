import { InputSignal } from '@angular/core';
import type { EventTarget } from '@angularflow/core';

export interface ITargetedEventListener {
  eventTarget: InputSignal<EventTarget | null>;
}

export type Event =
  | {
      type: 'pointerdown';
      event: PointerEvent;
      target: EventTarget | null;
    }
  | {
      type: 'pointerup';
      event: PointerEvent;
      target: EventTarget | null;
    }
  | {
      type: 'pointermove';
      event: PointerEvent;
    }
  | {
      type: 'pointerenter';
      event: PointerEvent;
      target: EventTarget | null;
    }
  | {
      type: 'pointerleave';
      event: PointerEvent;
      target: EventTarget | null;
    }
  | {
      type: 'keydown';
      event: KeyboardEvent;
    }
  | {
      type: 'keyup';
      event: KeyboardEvent;
    }
  | {
      type: 'keypress';
      event: KeyboardEvent;
    };
