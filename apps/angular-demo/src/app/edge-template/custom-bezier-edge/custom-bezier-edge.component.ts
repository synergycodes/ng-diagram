import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import { AngularAdapterCustomEdgeComponent, Edge, EdgeTemplate, Point } from '@angularflow/angular-adapter';

/**
 * The example below demonstrates how to create a custom edge with:
 * - a custom path shape for the edge,
 * - dynamic line color customization,
 * - and a customizable markerEnd (arrowhead).
 *
 */

@Component({
  selector: 'app-custom-bezier-edge',
  templateUrl: './custom-bezier-edge.component.html',
  styleUrls: ['./custom-bezier-edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AngularAdapterCustomEdgeComponent],
})
export class CustomBezierEdgeComponent implements EdgeTemplate {
  data = input.required<Edge>();

  points: Point[] = [];
  path = '';

  private prevSourcePosition?: Point;
  private prevTargetPosition?: Point;

  constructor() {
    effect(() => {
      const { sourcePosition, targetPosition } = this.data();
      const changed =
        this.prevSourcePosition !== sourcePosition || this.prevTargetPosition !== targetPosition || !this.path;

      if (changed && sourcePosition && targetPosition) {
        const points = this.bezierControlPoints(sourcePosition, targetPosition);
        this.path =
          points?.length === 4
            ? `M ${points[0].x},${points[0].y} C ${points[1].x},${points[1].y} ${points[2].x},${points[2].y} ${points[3].x},${points[3].y}`
            : points?.length === 2
              ? `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`
              : '';
        this.points = points;
      }

      this.prevSourcePosition = sourcePosition;
      this.prevTargetPosition = sourcePosition;
    });
  }

  bezierControlPoints = (source: Point, target: Point) => {
    if (!source || !target) return [];

    const c1 = { x: source.x + 100, y: source.y };
    const c2 = { x: target.x - 100, y: target.y };

    return [source, c1, c2, target];
  };

  get pathAndPoints() {
    return {
      points: this.points,
      path: this.path,
    };
  }
}
