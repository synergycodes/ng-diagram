import { Point, PortLocation } from '../../types';
import { Routing } from '../types';

/**
 * Straight line routing implementation
 */
export class StraightRouting implements Routing {
  name = 'straight';

  calculatePoints(source: PortLocation, target: PortLocation): Point[] {
    const sourcePoint = { x: source.x, y: source.y };
    const targetPoint = { x: target.x, y: target.y };
    return [sourcePoint, targetPoint];
  }

  generateSvgPath(points: Point[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

    const pathSegments = points.map((point, index) => {
      if (index === 0) return `M ${point.x},${point.y}`;
      return `L ${point.x},${point.y}`;
    });

    return pathSegments.join(' ');
  }
}
