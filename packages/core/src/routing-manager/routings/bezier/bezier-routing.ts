import { Point, RoutingConfiguration } from '../../../types';
import { Routing, RoutingContext } from '../../types';
import { computeBezierPath } from './compute-bezier-path';
import { computeBezierPointOnPath } from './compute-bezier-point-on-path';
import { computeBezierPoints } from './compute-bezier-points';

/**
 * Bezier curve routing implementation
 */
export class BezierRouting implements Routing {
  name = 'bezier';

  computePoints(context: RoutingContext, config?: RoutingConfiguration): Point[] {
    const { source, target } = context;
    const bezierControlOffset = config?.bezier?.bezierControlOffset ?? 100;

    // Now we have access to edge, nodes, and ports for more sophisticated routing
    // For example, we could adjust control offset based on node distance or type
    return computeBezierPoints(source, target, bezierControlOffset);
  }

  computeSvgPath(points: Point[]): string {
    return computeBezierPath(points);
  }

  computePointOnPath(points: Point[], percentage: number): Point {
    return computeBezierPointOnPath(points, percentage);
  }
}
