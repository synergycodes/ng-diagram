import { NgDiagramMath } from '../../../math';
import { Point, PortLocation } from '../../../types';
import { Routing } from '../../types';

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

  getPointOnPath(points: Point[], percentage: number): Point {
    if (points.length < 2) return points[0] || { x: 0, y: 0 };

    const clampedPercentage = NgDiagramMath.clamp({ min: 0, value: percentage, max: 1 });

    const startPoint = points[0];
    const endPoint = points[points.length - 1];

    const x = startPoint.x + (endPoint.x - startPoint.x) * clampedPercentage;
    const y = startPoint.y + (endPoint.y - startPoint.y) * clampedPercentage;

    return { x, y };
  }
}
