/**
 * Resolves a signed pixel distance into an absolute target length along a path.
 *
 * @remarks
 * Positive values measure from the start, negative from the end.
 * `-0` is treated as negative (i.e. resolves to the end of the path).
 * The result is clamped to `[0, totalLength]`.
 *
 * @param distancePx - Signed distance in pixels.
 * @param totalLength - Total length of the path.
 * @returns Clamped absolute distance from the start.
 */
export const normalizeDistance = (distancePx: number, totalLength: number): number => {
  const targetLength = distancePx >= 0 && !Object.is(distancePx, -0) ? distancePx : totalLength + distancePx;
  return Math.max(0, Math.min(targetLength, totalLength));
};
