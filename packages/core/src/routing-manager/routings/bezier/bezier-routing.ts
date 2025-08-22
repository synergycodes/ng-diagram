import { Point, PortLocation, RoutingConfiguration } from '../../../types';
import { Routing } from '../../types';
import { computeBezierPath } from './compute-bezier-path';
import { computeBezierPointOnPath } from './compute-bezier-point-on-path';
import { computeBezierPoints } from './compute-bezier-points';

/**
 * Bezier curve routing implementation
 */
export class BezierRouting implements Routing {
  name = 'bezier';

  computePoints(source: PortLocation, target: PortLocation, config?: RoutingConfiguration): Point[] {
    const bezierControlOffset = config?.bezier?.bezierControlOffset ?? 100;
    return computeBezierPoints(source, target, bezierControlOffset);
  }

  computeSvgPath(points: Point[]): string {
    return computeBezierPath(points);
  }

  computePointOnPath(points: Point[], percentage: number): Point {
    return computeBezierPointOnPath(points, percentage);
  }
}
