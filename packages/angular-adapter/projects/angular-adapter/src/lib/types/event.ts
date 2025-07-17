import { InputSignal } from '@angular/core';
import type { EventTarget } from '@angularflow/core';

export interface ITargetedEventListener {
  eventTarget: InputSignal<EventTarget>;
}

export interface PointerDragEvent extends PointerEvent {
  moveSelectionHandled?: boolean;
}
