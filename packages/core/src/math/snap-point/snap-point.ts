import { Point } from '../../types';
import { snapNumber } from '../snap-number/snap-number';

export const snapPoint = (point: Point, step: Point) => ({
  x: snapNumber(point.x, step.x),
  y: snapNumber(point.y, step.y),
});
