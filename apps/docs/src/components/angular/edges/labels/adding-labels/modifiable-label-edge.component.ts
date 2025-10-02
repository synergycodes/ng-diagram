import { Component, computed, input } from '@angular/core';
import {
  BaseEdgeLabelComponent,
  NgDiagramBaseEdgeComponent,
  type Edge,
  type NgDiagramEdgeTemplate,
} from 'ng-diagram';

// @section-start
@Component({
  selector: 'multi-label-edge',
  template: `<ng-diagram-base-edge
    [edge]="edge()"
    [stroke]="selected() ? 'rebeccapurple' : 'var(--ngd-default-edge-stroke)'"
  >
    <!-- @mark-start -->
    @if (label()) {
      <ng-diagram-base-edge-label
        [id]="label().id"
        [positionOnEdge]="label().positionOnEdge"
        class="label"
      >
        {{ label().content }}
      </ng-diagram-base-edge-label>
    }
    <!-- @mark-end -->
  </ng-diagram-base-edge>`,
  styleUrl: './modifiable-label-edge.component.scss',
  imports: [NgDiagramBaseEdgeComponent, BaseEdgeLabelComponent],
})
export class ModifiableLabelEdgeComponent
  implements NgDiagramEdgeTemplate<MultiLabelEdgeData>
{
  // @collapse-start
  edge = input.required<Edge<MultiLabelEdgeData>>();

  selected = computed(() => this.edge().selected);
  // @collapse-end

  // @mark-start
  label = computed(() => {
    const { label } = this.edge().data;

    if (!label) {
      return;
    }

    if (!Array.isArray(label)) {
      return { id: 'label', positionOnEdge: 0.5, content: label };
    }
  });
  // @mark-end
}
// @collapse-start

type MultiLabelEdgeData = {
  label: string;
};
// @collapse-end
// @section-end
