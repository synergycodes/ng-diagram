import { Point } from '../../../types';
import { getDistanceBetweenPoints } from '../../../utils/get-distance-between-points';

interface RotationPoints {
  handle: Point;
  center: Point;
  mouse: Point;
}

// https://stackoverflow.com/a/49151174/6743808
const getIsAnticlockwise = ({ handle, center, mouse }: RotationPoints) => {
  const x1 = handle.x - center.x;
  const y1 = handle.y - center.y;
  const x2 = mouse.x - center.x;
  const y2 = mouse.y - center.y;
  // We use Math.max to prevent division by zero
  const d1 = Math.max(0.001, Math.sqrt(x1 * x1 + y1 * y1));
  const d2 = Math.max(0.001, Math.sqrt(x2 * x2 + y2 * y2));

  const directionInt = Math.asin((x1 / d1) * (y2 / d2) - (y1 / d1) * (x2 / d2));

  return directionInt < 0;
};

// The angle near the center is the one we are looking for.
export const getRotationAngle = (params: RotationPoints) => {
  const isAntiClockwise = getIsAnticlockwise(params);
  const { handle, center, mouse } = params;

  const AB = Math.max(0.001, getDistanceBetweenPoints(center, handle));
  const BC = Math.max(0.001, getDistanceBetweenPoints(center, mouse));
  const AC = Math.max(0.001, getDistanceBetweenPoints(mouse, handle));

  const radians = Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
  const degrees = (radians * 180) / Math.PI;

  return isAntiClockwise ? -degrees : degrees;
};
