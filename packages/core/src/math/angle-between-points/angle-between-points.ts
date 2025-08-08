import { Point } from '../../types/utils';

export function angleBetweenPoints(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
}
