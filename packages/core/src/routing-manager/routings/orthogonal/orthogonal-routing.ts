import { Point, PortLocation, RoutingConfiguration } from '../../../types';
import { Routing } from '../../types';
import { computeOrthogonalPath } from './compute-orthogonal-path';
import { computeOrthogonalPointOnPath } from './compute-orthogonal-point-on-path';
import { computeOrthogonalPoints } from './compute-orthogonal-points';

/**
 * Orthogonal routing implementation
 */
export class OrthogonalRouting implements Routing {
  name = 'orthogonal';

  computePoints(source: PortLocation, target: PortLocation, config?: RoutingConfiguration): Point[] {
    const firstLastSegmentLength = config?.orthogonal?.firstLastSegmentLength ?? 20;
    return computeOrthogonalPoints(source, target, firstLastSegmentLength);
  }

  computeSvgPath(points: Point[]): string {
    return computeOrthogonalPath(points);
  }

  computePointOnPath(points: Point[], percentage: number): Point {
    return computeOrthogonalPointOnPath(points, percentage);
  }
}
