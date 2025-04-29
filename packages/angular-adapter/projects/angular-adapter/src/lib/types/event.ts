import { InputSignal } from '@angular/core';
import { Edge, Node } from '@angularflow/core';

export interface ITargetedEventListener {
  eventTarget: InputSignal<Node | Edge | null>;
}

export type Event =
  | {
      type: 'pointerdown';
      event: PointerEvent;
      target: Node | Edge | null;
    }
  | {
      type: 'pointerup';
      event: PointerEvent;
      target: Node | Edge | null;
    }
  | {
      type: 'pointermove';
      event: PointerEvent;
    }
  | {
      type: 'pointerenter';
      event: PointerEvent;
      target: Node | Edge | null;
    }
  | {
      type: 'pointerleave';
      event: PointerEvent;
      target: Node | Edge | null;
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
