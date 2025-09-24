import { Point } from '../../types/utils';

export const distanceBetweenPoints = (a: Point, b: Point) => {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
};
