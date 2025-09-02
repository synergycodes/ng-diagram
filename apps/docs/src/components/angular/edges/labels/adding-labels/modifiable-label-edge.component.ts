import { Component, computed, input } from '@angular/core';
import {
  BaseEdgeLabelComponent,
  NgDiagramBaseEdgeComponent,
  type Edge,
  type NgDiagramEdgeTemplate,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'multi-label-edge',
  template: `<ng-diagram-base-edge
    [edge]="edge()"
    [stroke]="selected() ? 'rebeccapurple' : 'white'"
  >
    @if (label()) {
      <ng-diagram-base-edge-label
        [id]="label().id"
        [positionOnEdge]="label().positionOnEdge"
        class="label"
      >
        {{ label().content }}
      </ng-diagram-base-edge-label>
    }
  </ng-diagram-base-edge>`,
  styles: `
    .label {
      background: #444;
      padding: 0.5rem;
      border-radius: 0.25rem;
    }
  `,
  imports: [NgDiagramBaseEdgeComponent, BaseEdgeLabelComponent],
})
export class ModifiableLabelEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge<MultiLabelEdgeData>>();

  selected = computed(() => this.edge().selected);

  label = computed(() => {
    const { label } = this.edge().data;

    if (!label) {
      return;
    }

    if (!Array.isArray(label)) {
      return { id: 'label', positionOnEdge: 0.5, content: label };
    }
  });
}

type MultiLabelEdgeData = {
  label: string;
};
