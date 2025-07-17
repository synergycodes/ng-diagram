import { DefaultRouting, Point, Routing } from '@angularflow/core';
import { GetPathImplementation } from './types';
import { getBezierPath } from './get-bezier-path';
import { getStraightPath } from './get-straight-path';
import { getOrthogonalPath } from './get-orthogonal-path';

export const getPath = (routing: Routing | undefined, points: Point[]) => {
  const getPathImplenentation = routing
    ? GET_PATH_MAP[(routing ?? 'orthogonal') as keyof GetPathMap]
    : getOrthogonalPath;

  return getPathImplenentation(points);
};

const GET_PATH_MAP: GetPathMap = {
  bezier: getBezierPath,
  orthogonal: getOrthogonalPath,
  straight: getStraightPath,
};

type GetPathMap = Record<DefaultRouting, GetPathImplementation>;
