import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Edge, NgDiagramBaseEdgeComponent, NgDiagramEdgeTemplate } from '@angularflow/angular-adapter';

/**
 * The example below demonstrates how to create a custom edge with:
 * - a custom path shape for the edge using manual routing mode,
 * - dynamic line color customization,
 * - and a customizable markerEnd (arrowhead).
 *
 */

@Component({
  selector: 'app-custom-bezier-edge',
  templateUrl: './custom-bezier-edge.component.html',
  styleUrls: ['./custom-bezier-edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramBaseEdgeComponent],
})
export class CustomBezierEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();

  customEdge = computed(() => {
    const edge = this.edge();
    const { sourcePosition, targetPosition } = edge;

    if (!sourcePosition || !targetPosition) {
      return edge;
    }

    // Calculate custom bezier control points
    const points = [
      sourcePosition,
      { x: sourcePosition.x + 100, y: sourcePosition.y },
      { x: targetPosition.x - 100, y: targetPosition.y },
      targetPosition,
    ];

    // Return edge with manual routing mode
    return {
      ...edge,
      routingMode: 'manual' as const,
      routing: 'bezier', // Use bezier routing to render the manual points
      points,
    };
  });
}
