import { Point } from '../../../types';
import { Routing, RoutingContext } from '../../types';
import { computePolynomialPointOnPath } from './compute-polynomial-point-on-path';

/**
 * Polynomial (polyline) routing implementation
 * Connects multiple points with straight line segments
 */
export class PolynomialRouting implements Routing {
  name = 'polynomial';

  computePoints(context: RoutingContext): Point[] {
    const { source, target, edge } = context;
    const sourcePoint = { x: source.x, y: source.y };
    const targetPoint = { x: target.x, y: target.y };

    // If edge has manual points provided, use them
    if (edge.points && edge.points.length > 2) {
      // Ensure source and target are at the ends
      const points = [...edge.points];
      points[0] = sourcePoint;
      points[points.length - 1] = targetPoint;
      return points;
    }

    // Default to straight line if no intermediate points
    return [sourcePoint, targetPoint];
  }

  computeSvgPath(points: Point[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

    // Create path with Move and Line commands
    const pathSegments = points.map((point, index) => {
      if (index === 0) return `M ${point.x},${point.y}`;
      return `L ${point.x},${point.y}`;
    });

    return pathSegments.join(' ');
  }

  computePointOnPath(points: Point[], percentage: number): Point {
    return computePolynomialPointOnPath(points, percentage);
  }
}
