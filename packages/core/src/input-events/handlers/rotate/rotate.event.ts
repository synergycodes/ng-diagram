import { Point } from '../../../types';
import { BasePointerInputEvent } from '../../input-events.interface';

export interface RotateInputEvent extends BasePointerInputEvent {
  name: 'rotate';
  /**
   * The point where the pointer event occured in client coordinates.
   */
  lastInputPoint: Point;
  /**
   * The center of drag handler in the diagram coordinates.
   */
  handle: Point;
  /**
   * The center of the node in the diagram coordinates.
   */
  center: Point;
}
