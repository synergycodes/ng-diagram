import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  BaseEdgeLabelComponent,
  Edge,
  NgDiagramBaseEdgeComponent,
  NgDiagramEdgeTemplate,
} from '@angularflow/angular-adapter';

/**
 * The example below demonstrates how to create a custom edge with:
 * - manual polyline routing with multiple waypoints,
 * - labels positioned along the path,
 *
 */

@Component({
  selector: 'app-custom-polyline-edge',
  templateUrl: './custom-polyline-edge.component.html',
  styleUrls: ['./custom-polyline-edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramBaseEdgeComponent, BaseEdgeLabelComponent],
})
export class CustomPolylineEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();

  customEdge = computed(() => {
    const edge = this.edge();
    const { sourcePosition, targetPosition } = edge;

    if (!sourcePosition || !targetPosition) {
      return edge;
    }

    const dx = targetPosition.x - sourcePosition.x;
    const dy = targetPosition.y - sourcePosition.y;
    const segments = 5;
    const offset = 25;

    const points = [sourcePosition];

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      points.push({
        x: sourcePosition.x + dx * t + (i % 2 ? offset : -offset),
        y: sourcePosition.y + dy * t + (i % 2 ? -offset : offset),
      });
    }

    points.push(targetPosition);

    return {
      ...edge,
      points,
      routing: 'polyline',
      routingMode: 'manual' as const,
    };
  });
}
