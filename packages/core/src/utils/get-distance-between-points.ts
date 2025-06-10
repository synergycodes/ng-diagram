import { Point } from '../types';

export const getDistanceBetweenPoints = (a: Point, b: Point) => {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
};
