import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import {
  AngularAdapterCustomEdgeComponent,
  AngularAdapterEdgeLabelComponent,
  Edge,
  IEdgeTemplate,
  Point,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'app-bezier-edge',
  templateUrl: './bezier-edge.component.html',
  styleUrls: ['./bezier-edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AngularAdapterCustomEdgeComponent, AngularAdapterEdgeLabelComponent, AngularAdapterEdgeLabelComponent],
})
export class BezierEdgeComponent implements IEdgeTemplate {
  data = input.required<Edge>();

  points: Point[] = [];
  path = '';
  private prevSourcePosition?: Point;
  private prevTargetPosition?: Point;

  constructor() {
    effect(() => {
      const currentSource = this.data().sourcePosition;
      const currentTarget = this.data().targetPosition;
      const sourceChanged = this.prevSourcePosition !== undefined && this.prevSourcePosition !== currentSource;
      const targetChanged = this.prevTargetPosition !== undefined && this.prevTargetPosition !== currentTarget;

      if (sourceChanged || targetChanged || !this.path) {
        if (currentSource && currentTarget) {
          const points = this.bezierControlPoints(currentSource, currentTarget);

          this.path =
            points?.length === 4
              ? `M ${points[0].x},${points[0].y} C ${points[1].x},${points[1].y} ${points[2].x},${points[2].y} ${points[3].x},${points[3].y}`
              : points?.length === 2
                ? `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`
                : '';

          this.points = points;
        }
      }

      this.prevSourcePosition = currentSource;
      this.prevTargetPosition = currentTarget;
    });
  }

  onButtonClick() {
    console.log('onClick');
  }

  bezierControlPoints = (source: Point, target: Point) => {
    if (!source || !target) return [];

    const c1 = { x: source.x + 100, y: source.y };
    const c2 = { x: target.x - 100, y: target.y };

    return [source, c1, c2, target];
  };
}
