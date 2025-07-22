import { Point } from '../../../types';
import { BasePointerInputEvent } from '../../__new__input-events.interface';

export interface RotateInputEvent extends BasePointerInputEvent {
  name: 'rotate';
  lastInputPoint: Point;
  handle: Point;
  center: Point;
}
