import { Component, computed, input } from '@angular/core';
import {
  NgDiagramBaseEdgeComponent,
  type Edge,
  type NgDiagramEdgeTemplate,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'sinusoid-edge',
  template: `<ng-diagram-base-edge
    [edge]="customEdge()"
    stroke="rebeccapurple"
    customMarkerEnd="ng-diagram-arrow"
  />`,
  imports: [NgDiagramBaseEdgeComponent],
})
export class SinusoidEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();

  customEdge = computed(() => {
    const edge = this.edge();
    const { sourcePosition, targetPosition } = edge;

    if (!sourcePosition || !targetPosition) {
      return edge;
    }

    const points = this.generateSinusoidPoints(sourcePosition, targetPosition);

    return {
      ...edge,
      points,
      routing: 'polyline',
      routingMode: 'manual' as const,
    };
  });

  private generateSinusoidPoints(
    sourcePosition: { x: number; y: number },
    targetPosition: { x: number; y: number }
  ) {
    const startX = sourcePosition.x;
    const startY = sourcePosition.y;
    const endX = targetPosition.x;
    const endY = targetPosition.y;

    // Calculate distance and angle between points
    const distance = Math.sqrt(
      Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
    );
    const angle = Math.atan2(endY - startY, endX - startX);

    // Sinusoidal wave parameters
    const amplitude = 20;
    const frequency = Math.max(2, distance / 100);
    const segments = Math.max(20, Math.floor(distance / 5));

    const points = [{ x: startX, y: startY }];

    // Generate sinusoidal curve points
    for (let i = 1; i < segments; i++) {
      const t = i / segments;

      // Base position along the straight line
      const baseX = startX + (endX - startX) * t;
      const baseY = startY + (endY - startY) * t;

      // Calculate perpendicular offset using sine wave
      // Fade out amplitude as we approach the end to ensure smooth connection
      const fadeFactor = i < segments - 5 ? 1 : (segments - i) / 5;
      const sineOffset =
        Math.sin(t * 2 * Math.PI * frequency) * amplitude * fadeFactor;
      const perpAngle = angle + Math.PI / 2;

      const x = baseX + Math.cos(perpAngle) * sineOffset;
      const y = baseY + Math.sin(perpAngle) * sineOffset;

      points.push({ x, y });
    }

    // Always end exactly at the target position
    points.push({ x: endX, y: endY });

    return points;
  }
}
