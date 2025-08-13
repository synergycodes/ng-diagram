import { DefaultRouting, Point, Routing } from '@angularflow/core';
import { getBezierPath } from './get-bezier-path';
import { getOrthogonalPath } from './get-orthogonal-path';
import { getStraightPath } from './get-straight-path';
import { GetPathImplementation } from './types';

export const getPath = (routing: Routing | undefined, points: Point[]) => {
  const getPathImplenentation = routing
    ? GET_PATH_MAP[(routing ?? 'orthogonal') as unknown as keyof GetPathMap]
    : getOrthogonalPath;

  return getPathImplenentation(points);
};

const GET_PATH_MAP: GetPathMap = {
  bezier: getBezierPath,
  orthogonal: getOrthogonalPath,
  straight: getStraightPath,
};

type GetPathMap = Record<DefaultRouting, GetPathImplementation>;
