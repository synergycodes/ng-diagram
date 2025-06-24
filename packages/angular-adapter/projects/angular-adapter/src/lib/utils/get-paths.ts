export function getStraightPath(points: { x: number; y: number }[]): string {
  if (!points || points.length < 2) {
    return '';
  }

  const [start, end] = points;
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

/** Radius for orthogonal edges. */
export const MAX_ORTHOGONAL_RADIUS = 16;

/** Distance from the source/target where edge breaks for the first and last handler. */
export const POINT_DISTANCE = 20;

/** Minimum distance from the source/target to the first point . */
export const ENDPOINT_OFFSET = 1;

export enum Orientation {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Determines the orientation of a segment based on its start and end X coordinates.
 *
 * @param startX - The X coordinate of the starting point of the segment.
 * @param endX - The X coordinate of the ending point of the segment.
 * @returns The orientation of the segment, either `Orientation.Vertical` if the start and end X coordinates are the same, or `Orientation.Horizontal` otherwise.
 */
export const getSegmentOrientation = (startX: number, endX: number) => {
  return startX === endX ? Orientation.Vertical : Orientation.Horizontal;
};

/**
 * Determines if the segment is growing based on its orientation and the positions of the source and target points.
 *
 * @param segmentOrientation - The orientation of the segment (either vertical or horizontal).
 * @param sourcePoint - The starting point of the segment with x and y coordinates.
 * @param targetPoint - The ending point of the segment with x and y coordinates.
 * @returns `true` if the segment is growing (i.e., the target point is further along the orientation axis than the source point), otherwise `false`.
 */
export const getIsGrowing = (segmentOrientation: Orientation, sourcePoint: Point, targetPoint: Point) =>
  segmentOrientation === Orientation.Vertical ? sourcePoint.y < targetPoint.y : sourcePoint.x < targetPoint.x;

/**
 * Generates an orthogonal SVG path string
 *
 * @param sourceX - The x-coordinate of the source handle.
 * @param sourceY - The y-coordinate of the source handle.
 * @param targetX - The x-coordinate of the target handle.
 * @param targetY - The y-coordinate of the target handle.
 * @param points - An optional array of intermediate points (XYPosition) through which the path should pass.
 * @returns A string representing the SVG path data for the orthogonal path.
 */
export const getOrthogonalPath = (points: Point[] = []): string => {
  if (points.length <= 2) {
    return getStraightPath(points);
  }
  console.log('points', points);
  const source = points[0];
  const middle = points.slice(1, -1);
  const target = points[points.length - 1];

  // @ts-ignore
  const pathArray = middle.map((point, index) => {
    const prevPoint = points[index];
    const nextPoint = points[index + 2];
    const orientation = getSegmentOrientation(prevPoint.x, point.x);

    // Compare the previous and next points to calculate a dynamic radius
    const dx = nextPoint.x - prevPoint.x;
    const dy = nextPoint.y - prevPoint.y;
    const radius = Math.min(Math.abs(dx) / 2, Math.abs(dy) / 2, MAX_ORTHOGONAL_RADIUS);

    //
    // // top left corner of canvas is 0,0
    // // Checking the positions of the previous and next points relative to our current point
    const isPreviousPointToTheLeft = prevPoint.x < point.x;
    const isPreviousPointToTheRight = prevPoint.x > point.x;
    const isPreviousPointBelow = prevPoint.y > point.y;
    const isPreviousPointAbove = prevPoint.y < point.y;
    const isNextPointToTheLeft = nextPoint.x < point.x;
    const isNextPointToTheRight = nextPoint.x > point.x;
    const isNextPointBelow = nextPoint.y > point.y;
    const isNextPointAbove = nextPoint.y < point.y;

    const isXCloseToPrevPoint = Math.abs(prevPoint.x - point.x) <= 1;
    const isYCloseToPrevPoint = Math.abs(prevPoint.y - point.y) <= 1;
    const isXCloseToNextPoint = Math.abs(nextPoint.x - point.x) <= 1;
    const isYCloseToNextPoint = Math.abs(nextPoint.y - point.y) <= 1;

    // If there are only 2 points and they make a straight line, we can skip them
    // because they already make a straight line between the source and the target.
    // This makes it easier to draw handlers and lines.
    if (
      middle.length <= 2 &&
      ((isXCloseToPrevPoint && isYCloseToPrevPoint) || (isXCloseToNextPoint && isYCloseToNextPoint))
    ) {
      return '';
    }
    // The `rotateClockwise` variable determines the direction of the arc segment
    const rotateClockwise =
      (isPreviousPointToTheLeft && isNextPointBelow) ||
      (isPreviousPointToTheRight && isNextPointAbove) ||
      (isPreviousPointAbove && isNextPointToTheLeft) ||
      (isPreviousPointBelow && isNextPointToTheRight);

    const isVerticalLine = prevPoint.x === point.x && point.x === nextPoint.x;
    const isHorizontalLine = prevPoint.y === point.y && point.y === nextPoint.y;

    // If they are straight lines
    if (isHorizontalLine) {
      return `L${point.x + (isPreviousPointToTheRight ? radius : -radius)},${point.y}`;
    }
    if (isVerticalLine) {
      return `L${point.x},${point.y + (isPreviousPointAbove ? -radius : radius)}`;
      // If there are corners
    }
    if (orientation === Orientation.Vertical) {
      // draw vertical line + arc from top/bottom to left/right
      const lineSegment = `L${point.x},${point.y + (isPreviousPointAbove ? -radius : radius)}`;
      const arcSegment = `A${radius},${radius},0,0,${rotateClockwise ? 1 : 0},${point.x + (isNextPointToTheRight ? radius : -radius)},${point.y}`;
      return `${lineSegment} ${arcSegment}`;
    }
    if (orientation === Orientation.Horizontal) {
      // draw horizontal line + arc from left/right to top/bottom
      const lineSegment = `L${point.x + (isPreviousPointToTheRight ? radius : -radius)},${point.y}`;
      const arcSegment = `A${radius},${radius},0,0,${rotateClockwise ? 1 : 0},${point.x},${point.y + (isNextPointAbove ? -radius : radius)}`;
      return `${lineSegment} ${arcSegment}`;
    }
  });

  return `M ${source.x},${source.y} ${pathArray.join(' ')} L ${target.x},${target.y}`;
};
