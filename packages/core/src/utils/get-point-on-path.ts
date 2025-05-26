export const getPointOnPath = (points: { x: number; y: number }[], percentage: number) => {
  if (points.length < 2) return { x: 0, y: 0 };

  const finalPercentage = Math.min(Math.max(percentage, 0), 1);

  // Step 1: Calculate segment lengths and total length
  const lengths: number[] = [];
  let totalLength = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const length = Math.hypot(dx, dy);
    lengths.push(length);
    totalLength += length;
  }

  const targetLength = totalLength * finalPercentage;
  let accumulated = 0;

  // Step 2: Find the segment where target length falls
  for (let i = 0; i < lengths.length; i++) {
    const segmentLength = lengths[i];
    if (accumulated + segmentLength >= targetLength) {
      const segmentStart = points[i];
      const segmentEnd = points[i + 1];
      const remaining = targetLength - accumulated;
      const segmentPercent = remaining / segmentLength;

      // Step 3: Interpolate within this segment
      const x = segmentStart.x + (segmentEnd.x - segmentStart.x) * segmentPercent;
      const y = segmentStart.y + (segmentEnd.y - segmentStart.y) * segmentPercent;

      return { x, y };
    }
    accumulated += segmentLength;
  }

  // If we reach here, return the last point
  return points[points.length - 1];
};
