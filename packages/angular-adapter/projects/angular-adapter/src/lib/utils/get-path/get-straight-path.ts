import { GetPathImplementation } from './types';

export const getStraightPath: GetPathImplementation = (points) => {
  if (!points || points.length < 2) {
    return '';
  }

  const [start, end] = points;
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
};
