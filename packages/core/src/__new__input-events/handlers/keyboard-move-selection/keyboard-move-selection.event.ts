import { Direction } from '../../../types';
import { BaseInputEvent } from '../../__new__input-events.interface';

export interface __NEW__KeyboardMoveSelectionEvent extends BaseInputEvent {
  name: 'keyboardMoveSelection';
  direction: Direction;
}
