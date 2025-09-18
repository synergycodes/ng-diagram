import { Direction } from '../../../types';
import { BaseInputEvent } from '../../input-events.interface';

export interface KeyboardPanningEvent extends BaseInputEvent {
  name: 'keyboardPanning';
  direction: Direction;
}
