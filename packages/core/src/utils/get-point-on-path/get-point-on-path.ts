import { Routing } from '../../types';
import { getPointOnOrthogonalPath } from './get-point-on-orthogonal-path';
import { getPointOnStraightPath } from './get-point-on-straight-path';
import { getPointOnBezierPath } from './get-point-on-bezier-path';
import { GetPointOnPathImplementation, GetPointOnPathOptions } from './types';

export const getPointOnPath = (options: GetPointOnPathOptions) => {
  const getPointOnPathImplementation = GET_POINT_ON_PATH_MAP[options.routing ?? 'orthogonal'];

  return getPointOnPathImplementation(options);
};

const GET_POINT_ON_PATH_MAP: Record<Routing, GetPointOnPathImplementation> = {
  orthogonal: getPointOnOrthogonalPath,
  straight: getPointOnStraightPath,
  bezier: getPointOnBezierPath,
};
