import { Direction } from '../../../types';
import { BaseInputEvent } from '../../input-events.interface';

export interface KeyboardMoveSelectionEvent extends BaseInputEvent {
  name: 'keyboardMoveSelection';
  direction: Direction;
}
