import { Point } from '../../../types';

/**
 * Generates an orthogonal SVG path string with rounded corners.
 * Creates smooth transitions at corners using arc segments.
 *
 * @param points - An array of points through which the path should pass.
 * @param maxRadius - Maximum radius for rounded corners (default: 16).
 * @returns A string representing the SVG path data for the orthogonal path.
 */
export const computeOrthogonalPath = (points: Point[] = [], maxRadius = 16): string => {
  // Handle edge cases
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  const source = points[0];
  const middle = points.slice(1, -1);
  const target = points[points.length - 1];

  // Process each intermediate point to create path segments with rounded corners
  const pathArray = middle.map((point, index) => {
    const prevPoint = points[index];
    const nextPoint = points[index + 2];

    // Calculate dynamic radius based on the distance between points
    const dx = nextPoint.x - prevPoint.x;
    const dy = nextPoint.y - prevPoint.y;
    const radius = Math.min(Math.abs(dx) / 2, Math.abs(dy) / 2, maxRadius);

    // Determine relative positions for direction calculation
    const isPreviousPointToTheLeft = prevPoint.x < point.x;
    const isPreviousPointToTheRight = prevPoint.x > point.x;
    const isPreviousPointBelow = prevPoint.y > point.y;
    const isPreviousPointAbove = prevPoint.y < point.y;
    const isNextPointToTheLeft = nextPoint.x < point.x;
    const isNextPointToTheRight = nextPoint.x > point.x;
    const isNextPointBelow = nextPoint.y > point.y;
    const isNextPointAbove = nextPoint.y < point.y;

    // Check if points are too close (within 1 pixel)
    const isXCloseToPrevPoint = Math.abs(prevPoint.x - point.x) <= 1;
    const isYCloseToPrevPoint = Math.abs(prevPoint.y - point.y) <= 1;
    const isXCloseToNextPoint = Math.abs(nextPoint.x - point.x) <= 1;
    const isYCloseToNextPoint = Math.abs(nextPoint.y - point.y) <= 1;

    // Skip rendering if points are too close and there are only 2 middle points
    if (
      middle.length <= 2 &&
      ((isXCloseToPrevPoint && isYCloseToPrevPoint) || (isXCloseToNextPoint && isYCloseToNextPoint))
    ) {
      return '';
    }

    // Determine if we have a straight line (no corner needed)
    const isVerticalLine = prevPoint.x === point.x && point.x === nextPoint.x;
    const isHorizontalLine = prevPoint.y === point.y && point.y === nextPoint.y;

    // Handle straight lines (no arc needed)
    if (isHorizontalLine) {
      return `L${point.x + (isPreviousPointToTheRight ? radius : -radius)},${point.y}`;
    }
    if (isVerticalLine) {
      return `L${point.x},${point.y + (isPreviousPointAbove ? -radius : radius)}`;
    }

    // Determine arc rotation direction based on the turn direction
    const rotateClockwise =
      (isPreviousPointToTheLeft && isNextPointBelow) ||
      (isPreviousPointToTheRight && isNextPointAbove) ||
      (isPreviousPointAbove && isNextPointToTheLeft) ||
      (isPreviousPointBelow && isNextPointToTheRight);

    // Handle corners with rounded transitions
    const isVertical = prevPoint.x === point.x;

    if (isVertical) {
      // Coming from vertical direction: draw line to radius point, then arc
      const lineSegment = `L${point.x},${point.y + (isPreviousPointAbove ? -radius : radius)}`;
      const arcSegment = `A${radius},${radius},0,0,${rotateClockwise ? 1 : 0},${
        point.x + (isNextPointToTheRight ? radius : -radius)
      },${point.y}`;
      return `${lineSegment} ${arcSegment}`;
    } else {
      // Coming from horizontal direction: draw line to radius point, then arc
      const lineSegment = `L${point.x + (isPreviousPointToTheRight ? radius : -radius)},${point.y}`;
      const arcSegment = `A${radius},${radius},0,0,${rotateClockwise ? 1 : 0},${point.x},${
        point.y + (isNextPointAbove ? -radius : radius)
      }`;
      return `${lineSegment} ${arcSegment}`;
    }
  });

  // Combine all segments into final SVG path
  return `M ${source.x},${source.y} ${pathArray.join(' ')} L ${target.x},${target.y}`;
};
