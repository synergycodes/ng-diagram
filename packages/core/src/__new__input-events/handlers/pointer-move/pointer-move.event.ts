import { Node } from '../../../types';
import { BasePointerInputEvent, InputEventPhase } from '../../__new__input-events.interface';

export interface __NEW__PointerMoveSelectionEvent extends BasePointerInputEvent {
  name: 'pointer-move-selection';
  phase: InputEventPhase;
  selectedNodes: Node[];
}
