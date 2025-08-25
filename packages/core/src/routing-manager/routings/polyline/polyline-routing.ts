import { Point } from '../../../types';
import { Routing, RoutingContext } from '../../types';
import { computePolylinePointOnPath } from './compute-polyline-point-on-path';

/**
 * Polyline routing implementation
 * Connects points with straight line segments
 * Supports both auto mode (2 points) and manual mode (multiple points)
 */
export class PolylineRouting implements Routing {
  name = 'polyline';

  computePoints(context: RoutingContext): Point[] {
    const { source, target, edge } = context;
    const sourcePoint = { x: source.x, y: source.y };
    const targetPoint = { x: target.x, y: target.y };

    // If edge has manual points provided, use them
    if (edge.routingMode === 'manual' && edge.points && edge.points.length > 2) {
      // Ensure source and target are at the ends
      const points = [...edge.points];
      points[0] = sourcePoint;
      points[points.length - 1] = targetPoint;
      return points;
    }

    // Default to straight line (2-point polyline)
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
    return computePolylinePointOnPath(points, percentage);
  }
}
