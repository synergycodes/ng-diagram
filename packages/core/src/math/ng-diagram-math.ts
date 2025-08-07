import { angleBetweenPoints } from './angle-between-points/angle-between-points';
import { calculateDistanceFromEdge } from './calculate-distance-from-edge/calculate-distance-from-edge';
import { calculateGradualForce } from './calculate-gradual-force/calculate-gradual-force';
import { clamp } from './clamp/clamp';
import { detectContainerEdge } from './detect-container-edge/detect-container-edge';
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
  detectContainerEdge,
  calculateDistanceFromEdge,
  calculateGradualForce,
  snapNumber,
  snapPoint,
};
