import type { EdgeEnd } from '../../../types/edge.interface';
import type { Point } from '../../../types/utils';
import type { BasePointerInputEvent, InputEventPhase } from '../../input-events.interface';

export interface RelinkingInputEvent extends BasePointerInputEvent {
  name: 'relinking';
  phase: InputEventPhase;
  /** Which endpoint of the edge is being dragged. */
  end: EdgeEnd;
  panningForce: Point | null;
  /** Set on an `end` emitted because another gesture claimed the pointer — the relink is cancelled, not finished. */
  takenOver?: boolean;
}
