import { clamp } from '../clamp/clamp';
import { normalizeAngle } from '../normalize-angle/normalize-angle';

/** Epsilon for floating-point comparisons */
const EPSILON = 0.0001;
/** Threshold for snapping to right angles (in degrees) */
const RIGHT_ANGLE_SNAP_THRESHOLD = 0.9;

/**
 * Returns the positive fractional part of a number.
 * @param n The number.
 */
function fractionalPart(n: number): number {
  return Math.abs(n - Math.trunc(n));
}

/**
 * Applies snapping and step logic to a rotation angle.
 * @param angle The raw angle after initial transformation (can be positive or negative, in degrees)
 * @param step The snapping step (e.g., 5 for 5-degree increments)
 * @returns The snapped angle (in degrees)
 */
export function snapAngle(angle: number, step: number): number {
  // Quantize the angle to the nearest step
  const numberOfStepsToAdd = Math.round(angle / step);

  // If step > 1 and the angle is too small, snap to 0
  if (numberOfStepsToAdd === 0 && step > 1) {
    return 0;
  }

  const isAngleBellowOneStep = Math.abs(numberOfStepsToAdd) === 1 && Math.abs(angle) < step;

  const snapIfLessThanDegrees = clamp({
    min: 1,
    max: step / 2 - 1,
    value: Math.floor(step / 2 - 1),
  });

  const isCloserToNextButNotEnoughToSnap = isAngleBellowOneStep && step - Math.abs(angle) > snapIfLessThanDegrees;

  if (isCloserToNextButNotEnoughToSnap) {
    return 0;
  }

  let snappedAngle = numberOfStepsToAdd * step;

  // Special handling for right angles if step === 1
  if (step === 1) {
    const isJustBeforeRightAngle = (snappedAngle + 1) % 90 === 0;
    const isJustAfterRightAngle = (snappedAngle - 1) % 90 === 0;

    // Snap to right angle if within threshold before or after
    if (isJustBeforeRightAngle) {
      const diff = 1 - fractionalPart(angle);

      if (diff < RIGHT_ANGLE_SNAP_THRESHOLD + EPSILON) {
        snappedAngle = snappedAngle + 1;
      }
    } else if (isJustAfterRightAngle) {
      const diff = fractionalPart(angle);

      if (diff < RIGHT_ANGLE_SNAP_THRESHOLD + EPSILON) {
        snappedAngle = snappedAngle - 1;
      }
    }
  }

  return normalizeAngle(snappedAngle);
}
