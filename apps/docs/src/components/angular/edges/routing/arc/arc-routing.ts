// @section-start
import type {
  EdgeRouting,
  EdgeRoutingConfig,
  EdgeRoutingContext,
  Point,
} from 'ng-diagram';

/**
 * Arc routing implementation using SVG elliptical arcs.
 *
 * Creates curved connections using SVG arc commands instead of bezier curves.
 * The arc radius can be configured, creating anything from subtle curves to dramatic swoops.
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
  computeSvgPath(points: Point[], config?: EdgeRoutingConfig): string {
    if (points.length < 2) return '';

    const start = points[0];
    const end = points[points.length - 1];

    // Calculate distance to use as radius
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Use configured radius or default to proportional to distance
    const radiusMultiplier = (config as any)?.arc?.radiusMultiplier ?? 0.5;
    const radius = distance * radiusMultiplier;

    // Create arc: sweep-flag=1 creates a clockwise arc (curves downward/rightward)
    return `M ${start.x},${start.y} A ${radius} ${radius} 0 0 1 ${end.x},${end.y}`;
  }

  /**
   * Computes a point along the arc at the given percentage.
   *
   * This is a simplified approximation. For more accuracy, you could
   * calculate the actual point on the elliptical arc curve.
   */
  computePointOnPath(points: Point[], percentage: number): Point {
    if (points.length < 2) return points[0] || { x: 0, y: 0 };

    const start = points[0];
    const end = points[points.length - 1];

    // Simple quadratic approximation of the arc
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Perpendicular offset for arc bulge
    const perpX = -dy;
    const perpY = dx;
    const length = Math.sqrt(perpX * perpX + perpY * perpY);

    if (length === 0) return { x: midX, y: midY };

    // Arc bulge (approximate)
    const bulge = length * 0.25;
    const offsetX = (perpX / length) * bulge;
    const offsetY = (perpY / length) * bulge;

    // Control point for quadratic curve approximation
    const controlX = midX + offsetX;
    const controlY = midY + offsetY;

    // Quadratic bezier interpolation
    const t = percentage;
    const oneMinusT = 1 - t;

    const x =
      oneMinusT * oneMinusT * start.x +
      2 * oneMinusT * t * controlX +
      t * t * end.x;
    const y =
      oneMinusT * oneMinusT * start.y +
      2 * oneMinusT * t * controlY +
      t * t * end.y;

    return { x, y };
  }
}
// @section-end
