import { Point } from '../../../types/utils';
import { BaseInputEvent } from '../../__new__input-events.interface';

export interface __NEW__ZoomingEvent extends BaseInputEvent {
  name: 'zoom';
  updatedViewport: Point;
  updateScale: number;
}
