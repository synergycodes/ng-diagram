import type { EdgeRouting, EdgeRoutingContext, Point } from 'ng-diagram';

/**
 * Arc routing implementation using SVG elliptical arcs.
 *
 * Creates curved connections using SVG arc commands
 */
export class ArcRouting implements EdgeRouting {
  name = 'arc';

  /**
   * Computes the points for an arc path.
   * For arcs, we only need the source and target points.
   */
  computePoints(context: EdgeRoutingContext): Point[] {
    const { sourcePoint, targetPoint } = context;
    return [
      { x: sourcePoint.x, y: sourcePoint.y },
      { x: targetPoint.x, y: targetPoint.y },
    ];
  }

  /**
   * Generates an SVG path string using an elliptical arc.
   *
   * The arc command (A) creates a curved path between source and target.
   * Format: A rx ry x-axis-rotation large-arc-flag sweep-flag x y
   */
  computeSvgPath(points: Point[]): string {
    if (points.length < 2) return '';

    const start = points[0];
    const end = points[points.length - 1];

    // Calculate distance to use as radius
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const radiusMultiplier = 0.5;
    const radius = distance * radiusMultiplier;

    // Create arc: sweep-flag=1 creates a clockwise arc (curves downward/rightward)
    return `M ${start.x},${start.y} A ${radius} ${radius} 0 0 1 ${end.x},${end.y}`;
  }
}
