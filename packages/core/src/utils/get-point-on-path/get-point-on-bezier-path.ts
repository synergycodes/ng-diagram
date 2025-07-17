import { GetPointOnPathImplementation } from './types';

export const getPointOnBezierPath: GetPointOnPathImplementation = ({ points, percentage }) => {
  if (points.length < 4) {
    // If we don't have enough points for a cubic Bézier, fall back to linear interpolation
    if (points.length < 2) return { x: 0, y: 0 };

    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const x = startPoint.x + (endPoint.x - startPoint.x) * percentage;
    const y = startPoint.y + (endPoint.y - startPoint.y) * percentage;
    return { x, y };
  }

  const t = Math.min(Math.max(percentage, 0), 1);

  // Cubic Bézier curve formula: B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
  const [p0, p1, p2, p3] = points;

  const oneMinusT = 1 - t;
  const oneMinusTSquared = oneMinusT * oneMinusT;
  const oneMinusTCubed = oneMinusTSquared * oneMinusT;
  const tSquared = t * t;
  const tCubed = tSquared * t;

  const x = oneMinusTCubed * p0.x + 3 * oneMinusTSquared * t * p1.x + 3 * oneMinusT * tSquared * p2.x + tCubed * p3.x;

  const y = oneMinusTCubed * p0.y + 3 * oneMinusTSquared * t * p1.y + 3 * oneMinusT * tSquared * p2.y + tCubed * p3.y;

  return { x, y };
};
