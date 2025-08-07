/**
 * Calculates the gradual panning force based on distance from edge.
 * The force decreases linearly as the distance from edge increases.
 *
 * @param distanceFromEdge - Distance in pixels from the edge
 * @param maxForce - The maximum force to apply (when at the very edge)
 * @param threshold - The distance threshold within which panning is active
 * @returns The calculated force (0 to maxForce)
 */
export const calculateGradualForce = (distanceFromEdge: number, maxForce: number, threshold: number): number => {
  if (distanceFromEdge >= threshold) {
    return 0;
  }

  // Linear interpolation: force decreases as distance increases
  const forceRatio = 1 - distanceFromEdge / threshold;
  return maxForce * forceRatio;
};
