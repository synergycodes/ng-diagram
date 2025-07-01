import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
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

  sourcePosition = computed<Point | undefined | unknown>(() => this.data().data?.['sourcePosition']);
  targetPosition = computed<Point | undefined | unknown>(() => this.data().data?.['targetPosition']);

  private getSourceAndTarget() {
    const edge = this.data();
    if (!edge) return [];
    const [source, target] = this.sourceTargetProvider.getSourceAndTargetPositions(edge);
    if (!source || !target) return [];
    return [source, target];
  }

  bezierControlPoints = computed(() => {
    const [source, target] = this.getSourceAndTarget();
    if (!source || !target) return [];

    const c1 = { x: source.x + 100, y: source.y };
    const c2 = { x: target.x - 100, y: target.y };

    return [source, c1, c2, target];
  });

  path = computed(() => {
    const points = this.bezierControlPoints();
    if (!points) return '';
    return `M ${points[0].x},${points[0].y} C ${points[1].x},${points[1].y} ${points[2].x},${points[2].y} ${points[3].x},${points[3].y}`;
  });
}
