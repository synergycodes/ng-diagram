import { Direction } from '../../../types';
import { __NEW__NEW__BaseInputEvent } from '../../__new__input-events.interface';

export interface __NEW__KeyboardPanningEvent extends __NEW__NEW__BaseInputEvent {
  name: 'keyboard-panning';
  direction: Direction;
}
