import { getStraightPath } from './get-straight-path';
import { GetPathImplementation } from './types';

export const getBezierPath: GetPathImplementation = (points) => {
  if (points.length <= 2) {
    return getStraightPath(points);
  }

  return `M ${points[0].x},${points[0].y} C ${points[1].x},${points[1].y} ${points[2].x},${points[2].y} ${points[3].x},${points[3].y}`;
};
