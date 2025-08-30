import type { PortSide } from '../../types/utils';
import { normalizeAngle } from '../normalize-angle/normalize-angle';

/**
 * Converts an angle in degrees to the corresponding side.
 * Uses 45° segments to determine the optimal side.
 *
 * @param angleDegrees The angle in degrees (will be normalized to 0-360)
 * @param inverse If true, returns the opposite side (for connection points)
 * @returns The side corresponding to the angle
 */
export const angleToSide = (angleDegrees: number, inverse = false): PortSide => {
  const angle = normalizeAngle(angleDegrees);

  let side: PortSide;

  // Determine the primary direction based on angle
  if (angle >= 315 || angle < 45) {
    side = 'right';
  } else if (angle >= 45 && angle < 135) {
    side = 'bottom';
  } else if (angle >= 135 && angle < 225) {
    side = 'left';
  } else {
    side = 'top';
  }

  // If inverse is true, return the opposite side
  if (inverse) {
    const opposites: Record<PortSide, PortSide> = {
      right: 'left',
      left: 'right',
      top: 'bottom',
      bottom: 'top',
    };
    return opposites[side];
  }

  return side;
};
