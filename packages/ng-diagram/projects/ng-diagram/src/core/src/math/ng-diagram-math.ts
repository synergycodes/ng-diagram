import { angleBetweenPoints } from './angle-between-points/angle-between-points';
import { angleToSide } from './angle-to-side/angle-to-side';
import { calculateEdgePanningForce } from './calculate-edge-panning-force/calculate-edge-panning-force';
import { clamp } from './clamp/clamp';
import { distanceBetweenPoints } from './distance-between-points/distance-between-points';
import { normalizeAngle } from './normalize-angle/normalize-angle';
import { snapAngle } from './snap-angle/snap-angle';
import { snapNumber } from './snap-number/snap-number';
import { snapPoint } from './snap-point/snap-point';

export const NgDiagramMath = {
  angleBetweenPoints,
  angleToSide,
  clamp,
  distanceBetweenPoints,
  normalizeAngle,
  snapAngle,
  snapNumber,
  snapPoint,
  calculateEdgePanningForce,
};
