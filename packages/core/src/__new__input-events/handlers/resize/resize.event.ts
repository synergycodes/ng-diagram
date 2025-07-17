import { __NEW__InputPhase, __NEW__NEW__BasePointerInputEvent } from '../../__new__input-events.interface';

export type ResizeDirection =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom';

export interface __NEW__ResizeEvent extends __NEW__NEW__BasePointerInputEvent {
  name: 'resize';
  phase: __NEW__InputPhase;
  direction: ResizeDirection;
}
