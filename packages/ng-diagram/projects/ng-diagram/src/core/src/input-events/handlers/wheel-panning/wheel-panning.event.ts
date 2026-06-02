import { BaseInputEvent } from '../../input-events.interface';

export interface WheelPanningEvent extends BaseInputEvent {
  name: 'wheelPanning';
  deltaX: number;
  deltaY: number;
}
