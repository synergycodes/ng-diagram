// TODO: Test me!

import { Point } from '../../types';

export interface __NEW__BaseInputEvent {
  id: string;
  originalEvent: string;
  timestamp: number;
  // source: InputSource;
  // phase: InteractionPhase;
  target: EventTarget;
  // modifiers: InputModifiers;
  name: unknown;
}

export interface __NEW__BasePointerEvent extends __NEW__BaseInputEvent {
  source: 'pointer';
  // pointerId: number;
  position: Point;
  // pressure: number;
  // button?: number;
  // pointerType: 'mouse' | 'touch' | 'pen';
}
