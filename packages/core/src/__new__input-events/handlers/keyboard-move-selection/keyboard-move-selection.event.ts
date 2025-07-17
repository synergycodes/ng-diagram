import { Direction } from '../../../types';
import { __NEW__NEW__BaseInputEvent } from '../../__new__input-events.interface';

export interface __NEW__KeyboardMoveSelectionEvent extends __NEW__NEW__BaseInputEvent {
  name: 'keyboard-move-selection';
  direction: Direction;
}
