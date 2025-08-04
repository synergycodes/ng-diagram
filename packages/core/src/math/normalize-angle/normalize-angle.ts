/**
 * Normalizes an angle to be within the range of 0-360 degrees.
 * @param angle The angle to normalize.
 * @returns The normalized angle.
 */
export const normalizeAngle = (angle: number): number => {
  return ((angle % 360) + 360) % 360;
};
