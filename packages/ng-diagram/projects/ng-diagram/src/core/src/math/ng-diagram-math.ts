import { angleBetweenPoints } from './angle-between-points/angle-between-points';
import { angleToSide } from './angle-to-side/angle-to-side';
import { clamp } from './clamp/clamp';
import { detectContainerEdge } from './detect-container-edge/detect-container-edge';
import { distanceBetweenPoints } from './distance-between-points/distance-between-points';
import { normalizeAngle } from './normalize-angle/normalize-angle';
import { snapAngle } from './snap-angle/snap-angle';
import { snapNumber } from './snap-number/snap-number';
import { snapPoint } from './snap-point/snap-point';
import { calculateDistanceFromEdge } from './calculate-distance-from-edge/calculate-distance-from-edge';

export const NgDiagramMath = {
  angleBetweenPoints,
  angleToSide,
  clamp,
  distanceBetweenPoints,
  normalizeAngle,
  snapAngle,
  detectContainerEdge,
  snapNumber,
  snapPoint,
  calculateDistanceFromEdge,
};
