export function getStraightPath(points: { x: number; y: number }[]): string {
  if (!points || points.length < 2) {
    return '';
  }

  const [start, end] = points;
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}
