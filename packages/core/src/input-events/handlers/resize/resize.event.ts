import { BasePointerInputEvent, InputEventPhase } from '../../input-events.interface';

export type ResizeDirection =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom';

export interface ResizeEvent extends BasePointerInputEvent {
  name: 'resize';
  phase: InputEventPhase;
  direction: ResizeDirection;
}
