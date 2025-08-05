import { Point } from '../../types/utils';
import { distanceBetweenPoints } from '../distance-between-points/distance-between-points';

// https://stackoverflow.com/a/49151174/6743808
const getIsAnticlockwise = (start: Point, center: Point, end: Point) => {
  const x1 = start.x - center.x;
  const y1 = start.y - center.y;
  const x2 = end.x - center.x;
  const y2 = end.y - center.y;
  // We use Math.max to prevent division by zero
  const d1 = Math.max(0.001, Math.sqrt(x1 * x1 + y1 * y1));
  const d2 = Math.max(0.001, Math.sqrt(x2 * x2 + y2 * y2));

  const directionInt = Math.asin((x1 / d1) * (y2 / d2) - (y1 / d1) * (x2 / d2));

  return directionInt < 0;
};

// The angle near the center is the one we are looking for.
export const angleBetweenPoints = (start: Point, center: Point, end: Point) => {
  const isAntiClockwise = getIsAnticlockwise(start, center, end);

  const AB = Math.max(0.001, distanceBetweenPoints(center, start));
  const BC = Math.max(0.001, distanceBetweenPoints(center, end));
  const AC = Math.max(0.001, distanceBetweenPoints(end, start));

  const radians = Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
  const degrees = (radians * 180) / Math.PI;

  return isAntiClockwise ? -degrees : degrees;
};
