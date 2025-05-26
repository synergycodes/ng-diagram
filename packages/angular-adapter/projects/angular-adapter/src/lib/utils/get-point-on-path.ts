export const getPointOnPath = (path: SVGPathElement, percentage: number) => {
  const totalLength = path.getTotalLength();
  const lengthAtPercent = totalLength * percentage;
  const point = path.getPointAtLength(lengthAtPercent);
  return { x: point.x, y: point.y };
};
