import { clamp } from '../../../utils/clamp';
import { normalizeAngle } from './normalize-angle';

/**
 * Applies snapping and step logic to a rotation angle.
 * @param angle The raw angle after initial transformation (can be positive or negative, in degrees)
 * @param step The snapping step (e.g., 5 for 5-degree increments)
 * @returns The snapped angle (in degrees)
 */
export function snapRotate(angle: number, step: number): number {
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

    if (isJustBeforeRightAngle || isJustAfterRightAngle) {
      const offset = isJustBeforeRightAngle ? 1 : -1;
      const rawDifference = Math.abs(Math.abs(offset) - Math.abs(angle % 1));

      if (rawDifference < 0.9) {
        snappedAngle = snappedAngle + offset;
      }
    }
  }

  return normalizeAngle(snappedAngle);
}
