import { InputSignal } from '@angular/core';
import type { EventTarget } from '@angularflow/core';

export interface ITargetedEventListener {
  eventTarget: InputSignal<EventTarget>;
}

export interface PointerInputEvent extends PointerEvent {
  moveSelectionHandled?: boolean;
  zoomingHandled?: boolean;
}
