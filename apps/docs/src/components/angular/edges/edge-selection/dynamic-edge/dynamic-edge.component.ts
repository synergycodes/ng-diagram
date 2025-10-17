// @section-start
import { Component, computed, input } from '@angular/core';
import {
  NgDiagramBaseEdgeComponent,
  type Edge,
  type NgDiagramEdgeTemplate,
} from 'ng-diagram';

@Component({
  // @mark-substring:[stroke]="edgeColor()"
  // @mark-substring:[strokeWidth]="edgeWidth()"
  // @mark-start
  template: `<ng-diagram-base-edge
    [edge]="edge()"
    [stroke]="edgeColor()"
    [strokeWidth]="edgeWidth()"
  />`,
  // @mark-end
  imports: [NgDiagramBaseEdgeComponent],
})
export class DynamicEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();

  // @mark-start
  edgeColor = computed(() => {
    const edge = this.edge();
    if (edge.selected) return 'yellow';
    if (edge.temporary) return 'gray';
    return 'black';
  });
  edgeWidth = computed(() => (this.edge().selected ? 3 : 2));
  // @mark-end
}
// @section-end
