import { Point, PortLocation } from '../../types';
import { getOrthogonalPathPoints } from '../../utils/edges-orthogonal-routing/get-orthogonal-path-points';
import { Routing } from '../types';

/**
 * Orthogonal routing implementation
 */
export class OrthogonalRouting implements Routing {
  name = 'orthogonal';

  calculatePoints(source: PortLocation, target: PortLocation): Point[] {
    return getOrthogonalPathPoints(source, target);
  }

  generateSvgPath(points: Point[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
    if (points.length === 2) {
      return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
    }

    const source = points[0];
    const middle = points.slice(1, -1);
    const target = points[points.length - 1];

    const pathArray = middle.map((point, index) => {
      const prevPoint = points[index];
      const nextPoint = points[index + 2];

      // Maximum radius for orthogonal corners
      const MAX_RADIUS = 16;

      // Calculate dynamic radius based on distance
      const dx = nextPoint.x - prevPoint.x;
      const dy = nextPoint.y - prevPoint.y;
      const radius = Math.min(Math.abs(dx) / 2, Math.abs(dy) / 2, MAX_RADIUS);

      // Check relative positions
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

      // Skip if points are too close
      if (
        middle.length <= 2 &&
        ((isXCloseToPrevPoint && isYCloseToPrevPoint) || (isXCloseToNextPoint && isYCloseToNextPoint))
      ) {
        return '';
      }

      // Determine arc direction
      const rotateClockwise =
        (isPreviousPointToTheLeft && isNextPointBelow) ||
        (isPreviousPointToTheRight && isNextPointAbove) ||
        (isPreviousPointAbove && isNextPointToTheLeft) ||
        (isPreviousPointBelow && isNextPointToTheRight);

      const isVerticalLine = prevPoint.x === point.x && point.x === nextPoint.x;
      const isHorizontalLine = prevPoint.y === point.y && point.y === nextPoint.y;

      // Handle straight lines
      if (isHorizontalLine) {
        return `L${point.x + (isPreviousPointToTheRight ? radius : -radius)},${point.y}`;
      }
      if (isVerticalLine) {
        return `L${point.x},${point.y + (isPreviousPointAbove ? -radius : radius)}`;
      }

      // Handle corners
      const isVertical = prevPoint.x === point.x;
      if (isVertical) {
        // Vertical line + arc from top/bottom to left/right
        const lineSegment = `L${point.x},${point.y + (isPreviousPointAbove ? -radius : radius)}`;
        const arcSegment = `A${radius},${radius},0,0,${rotateClockwise ? 1 : 0},${point.x + (isNextPointToTheRight ? radius : -radius)},${point.y}`;
        return `${lineSegment} ${arcSegment}`;
      } else {
        // Horizontal line + arc from left/right to top/bottom
        const lineSegment = `L${point.x + (isPreviousPointToTheRight ? radius : -radius)},${point.y}`;
        const arcSegment = `A${radius},${radius},0,0,${rotateClockwise ? 1 : 0},${point.x},${point.y + (isNextPointAbove ? -radius : radius)}`;
        return `${lineSegment} ${arcSegment}`;
      }
    });

    return `M ${source.x},${source.y} ${pathArray.join(' ')} L ${target.x},${target.y}`;
  }
}
