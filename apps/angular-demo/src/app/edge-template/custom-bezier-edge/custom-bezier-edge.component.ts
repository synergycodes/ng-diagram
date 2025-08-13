import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Edge, NgDiagramBaseEdgeComponent, NgDiagramEdgeTemplate } from '@angularflow/angular-adapter';

/**
 * The example below demonstrates how to create a custom edge with:
 * - a custom path shape for the edge using staticPath,
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

    // Generate custom SVG path
    const svgPath = `M ${points[0].x},${points[0].y} C ${points[1].x},${points[1].y} ${points[2].x},${points[2].y} ${points[3].x},${points[3].y}`;

    // Return edge with staticPath
    return {
      ...edge,
      staticPath: {
        points,
        svgPath,
      },
    };
  });
}
