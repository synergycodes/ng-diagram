import { Point } from '../../../types/utils';
import { BaseInputEvent } from '../../input-events.interface';

export interface ZoomingEvent extends BaseInputEvent {
  name: 'zoom';
  centerPoint: Point;
  zoomFactor: number;
}
