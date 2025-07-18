import { BasePointerInputEvent, InputEventPhase } from '../../__new__input-events.interface';

export type ResizeDirection =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom';

export interface __NEW__ResizeEvent extends BasePointerInputEvent {
  name: 'resize';
  phase: InputEventPhase;
  direction: ResizeDirection;
}
