import { Point, PortLocation, RoutingConfiguration } from '../../types';
import { getBezierPathPoints } from '../../utils/get-bezier-path-points';
import { Routing } from '../types';

/**
 * Bezier curve routing implementation
 */
export class BezierRouting implements Routing {
  name = 'bezier';

  calculatePoints(source: PortLocation, target: PortLocation, config?: RoutingConfiguration): Point[] {
    const bezierControlOffset = config?.bezier?.bezierControlOffset ?? 100;
    return getBezierPathPoints(source, target, bezierControlOffset);
  }

  generateSvgPath(points: Point[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
    if (points.length === 2) {
      return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
    }
    if (points.length === 4) {
      // Standard bezier curve with control points
      return `M ${points[0].x},${points[0].y} C ${points[1].x},${points[1].y} ${points[2].x},${points[2].y} ${points[3].x},${points[3].y}`;
    }

    // Fallback to straight line for unexpected point counts
    const pathSegments = points.map((point, index) => {
      if (index === 0) return `M ${point.x},${point.y}`;
      return `L ${point.x},${point.y}`;
    });
    return pathSegments.join(' ');
  }
}
