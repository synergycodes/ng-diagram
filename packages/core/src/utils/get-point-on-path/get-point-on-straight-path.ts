import { GetPointOnPathImplementation } from './types';

export const getPointOnStraightPath: GetPointOnPathImplementation = ({ points, percentage }) => {
  const [startPoint, endPoint] = points;

  const x = startPoint.x + (endPoint.x - startPoint.x) * percentage;
  const y = startPoint.y + (endPoint.y - startPoint.y) * percentage;

  return { x, y };
};
