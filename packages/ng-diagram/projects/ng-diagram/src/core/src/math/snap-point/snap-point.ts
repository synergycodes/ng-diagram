import { Point, Size } from '../../types';
import { snapNumber } from '../snap-number/snap-number';

export const snapPoint = (point: Point, step: Size) => ({
  x: snapNumber(point.x, step.width),
  y: snapNumber(point.y, step.height),
});
