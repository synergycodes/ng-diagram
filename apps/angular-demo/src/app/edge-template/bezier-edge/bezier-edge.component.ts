import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import {
  AngularAdapterCustomEdgeComponent,
  Edge,
  IEdgeTemplate,
  Point,
  SourceTargetPositionService,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'app-bezier-edge',
  templateUrl: './bezier-edge.component.html',
  styleUrls: ['./bezier-edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AngularAdapterCustomEdgeComponent],
})
export class BezierEdgeComponent implements IEdgeTemplate {
  data = input.required<Edge>();
  private readonly sourceTargetProvider = inject(SourceTargetPositionService);

  sourcePosition = computed<Point | undefined | unknown>(() => this.data()?.['sourcePosition']);
  targetPosition = computed<Point | undefined | unknown>(() => this.data()?.['targetPosition']);

  points: Point[] = [];
  path: string = '';

  private getSourceAndTarget() {
    const edge = this.data();
    if (!edge) return [];
    const [source, target] = this.sourceTargetProvider.getSourceAndTargetPositions(edge);
    if (!source || !target) return [];
    return [source, target];
  }

  private prevSourcePosition?: Point;
  private prevTargetPosition?: Point;

  constructor() {
    console.log('BezierEdgeComponent');
    effect(() => {
      const currentSource = this.data().sourcePosition;
      const currentTarget = this.data().targetPosition;
      console.log('e');
      // Sprawdź, czy zmienił się sourcePosition lub targetPosition
      const sourceChanged = this.prevSourcePosition !== undefined && this.prevSourcePosition !== currentSource;
      const targetChanged = this.prevTargetPosition !== undefined && this.prevTargetPosition !== currentTarget;
      console.log('currentSource', currentSource);
      console.log('currentSource', currentTarget);
      if (sourceChanged || targetChanged || !this.path) {
        console.log('sourceChanged', sourceChanged);
        if (currentSource && currentTarget) {
          const points = this.bezierControlPoints(currentSource, currentTarget);
          const path = points
            ? `M ${points[0].x},${points[0].y} C ${points[1].x},${points[1].y} ${points[2].x},${points[2].y} ${points[3].x},${points[3].y}`
            : '';

          this.points = points;
          this.path = path;
        }
      }

      this.prevSourcePosition = currentSource;
      this.prevTargetPosition = currentTarget;
    });
  }

  bezierControlPoints = (source: Point, target: Point) => {
    // const [source, target] = this.getSourceAndTarget();
    // const source = this.data().sourcePosition;
    // const target  = this.data().targetPosition;
    if (!source || !target) return [];

    const c1 = { x: source.x + 100, y: source.y };
    const c2 = { x: target.x - 100, y: target.y };

    return [source, c1, c2, target];
  };

  // path = computed(() => {
  //   console.log("thisdata", this.data())
  //   const source = this.data().sourcePosition
  //   const points = this.bezierControlPoints();
  //   console.log("points", points)
  //   return ''
  //   // if (!points) return '';
  //   // return `M ${points[0].x},${points[0].y} C ${points[1].x},${points[1].y} ${points[2].x},${points[2].y} ${points[3].x},${points[3].y}`;
  // });
}
