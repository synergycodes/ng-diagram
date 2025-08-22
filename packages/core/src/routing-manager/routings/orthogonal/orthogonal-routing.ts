import { Point, PortLocation } from '../../../types';
import { Routing } from '../../types';
import { computeOrthogonalPath } from './compute-orthogonal-path';
import { computeOrthogonalPointOnPath } from './compute-orthogonal-point-on-path';
import { computeOrthogonalPoints } from './compute-orthogonal-points';

/**
 * Orthogonal routing implementation
 */
export class OrthogonalRouting implements Routing {
  name = 'orthogonal';

  calculatePoints(source: PortLocation, target: PortLocation): Point[] {
    return computeOrthogonalPoints(source, target);
  }

  generateSvgPath(points: Point[]): string {
    return computeOrthogonalPath(points);
  }

  getPointOnPath(points: Point[], percentage: number): Point {
    return computeOrthogonalPointOnPath(points, percentage);
  }
}
