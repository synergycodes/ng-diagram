import { Point } from '../../../types';
import { BasePointerInputEvent, InputEventPhase } from '../../input-events.interface';

export interface RotateInputEvent extends BasePointerInputEvent {
  name: 'rotate';
  /**
   * Phase of the rotation action
   */
  phase: InputEventPhase;
  /**
   * The point where the pointer event occured in client coordinates.
   */
  lastInputPoint: Point;
  /**
   * The center of the node in the diagram coordinates.
   */
  center: Point;
}
