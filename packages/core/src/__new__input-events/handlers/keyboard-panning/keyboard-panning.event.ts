import { Direction } from '../../../types';
import { BaseInputEvent } from '../../__new__input-events.interface';

export interface __NEW__KeyboardPanningEvent extends BaseInputEvent {
  name: 'keyboardPanning';
  direction: Direction;
}
