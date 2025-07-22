import { Point } from '../../../types';
import { BasePointerInputEvent } from '../../input-events.interface';

export interface RotateInputEvent extends BasePointerInputEvent {
  name: 'rotate';
  lastInputPoint: Point;
  handle: Point;
  center: Point;
}
