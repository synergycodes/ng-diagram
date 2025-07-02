import { Point } from '@angularflow/core';
import { Orientation } from '../../types';
import { getStraightPath } from './get-straight-paths';

// Todo: move to mock data?
/** Radius for orthogonal edges. */
export const MAX_ORTHOGONAL_RADIUS = 16;

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
 * Generates an orthogonal SVG path string
 *
 * @param points - An optional array of intermediate points (XYPosition) through which the path should pass.
 * @returns A string representing the SVG path data for the orthogonal path.
 */
export const getOrthogonalPath = (points: Point[] = []): string => {
  if (points.length <= 2) {
    return getStraightPath(points);
  }

  const source = points[0];
  const middle = points.slice(1, -1);
  const target = points[points.length - 1];

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
    return '';
  });

  return `M ${source.x},${source.y} ${pathArray.join(' ')} L ${target.x},${target.y}`;
};
