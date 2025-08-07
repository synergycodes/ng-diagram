import { angleBetweenPoints } from './angle-between-points/angle-between-points';
import { clamp } from './clamp/clamp';
import { distanceBetweenPoints } from './distance-between-points/distance-between-points';
import { normalizeAngle } from './normalize-angle/normalize-angle';
import { snapAngle } from './snap-angle/snap-angle';
import { snapNumber } from './snap-number/snap-number';
import { snapPoint } from './snap-point/snap-point';

export const NgDiagramMath = {
  clamp,
  distanceBetweenPoints,
  angleBetweenPoints,
  normalizeAngle,
  snapAngle,
  snapNumber,
  snapPoint,
};
