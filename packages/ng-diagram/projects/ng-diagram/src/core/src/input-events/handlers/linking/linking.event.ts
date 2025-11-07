import { Point } from '../../../types';
import { BasePointerInputEvent, InputEventPhase } from '../../input-events.interface';

export interface LinkingInputEvent extends BasePointerInputEvent {
  name: 'linking';
  phase: InputEventPhase;
  portId: string;
  panningForce: Point | null;
}
