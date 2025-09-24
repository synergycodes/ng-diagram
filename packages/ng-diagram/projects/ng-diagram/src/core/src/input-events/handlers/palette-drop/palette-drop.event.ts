import { Point } from '../../../types/utils';
import { BaseInputEvent } from '../../input-events.interface';

export interface PaletteDropInputEvent extends BaseInputEvent {
  name: 'paletteDrop';
  lastInputPoint: Point;
  data: Record<string, unknown>;
}
