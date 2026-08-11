import { Point, Size } from '../../types';
import { snapNumber } from '../snap-number/snap-number';

/**
 * Snaps a point to a grid defined by `step`, optionally shifted by `offset`.
 * Each axis snaps to `offset + n * step` (see {@link snapNumber}).
 */
export const snapPoint = (point: Point, step: Size, offset: Size = { width: 0, height: 0 }) => ({
  x: snapNumber(point.x, step.width, offset.width),
  y: snapNumber(point.y, step.height, offset.height),
});
