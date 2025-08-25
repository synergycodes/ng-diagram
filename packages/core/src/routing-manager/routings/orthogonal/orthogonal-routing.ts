import { Point, RoutingConfiguration } from '../../../types';
import { Routing, RoutingContext } from '../../types';
import { computeOrthogonalPath } from './compute-orthogonal-path';
import { computeOrthogonalPointOnPath } from './compute-orthogonal-point-on-path';
import { computeOrthogonalPoints } from './compute-orthogonal-points';

/**
 * Orthogonal routing implementation
 */
export class OrthogonalRouting implements Routing {
  name = 'orthogonal';

  computePoints(context: RoutingContext, config?: RoutingConfiguration): Point[] {
    const { source, target } = context;
    const configValue = config?.orthogonal?.firstLastSegmentLength;
    const firstLastSegmentLength = configValue != null && configValue >= 0 ? configValue : 20;

    // Now we have access to edge, nodes, and ports for more sophisticated routing
    // For now, we'll keep the same logic but could enhance it based on context
    return computeOrthogonalPoints(source, target, firstLastSegmentLength);
  }

  computeSvgPath(points: Point[], config?: RoutingConfiguration): string {
    const configValue = config?.orthogonal?.maxCornerRadius;
    const maxCornerRadius = configValue != null && configValue >= 0 ? configValue : 16;
    return computeOrthogonalPath(points, maxCornerRadius);
  }

  computePointOnPath(points: Point[], percentage: number): Point {
    return computeOrthogonalPointOnPath(points, percentage);
  }
}
