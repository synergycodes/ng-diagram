// @section-start
import { Component, computed, input } from '@angular/core';
import {
  NgDiagramBaseEdgeComponent,
  NgDiagramBaseEdgeLabelComponent,
  type Edge,
  type NgDiagramEdgeTemplate,
} from 'ng-diagram';

const LABEL_COUNT = 10;
const ANIMATION_DURATION = 0.5;

@Component({
  selector: 'multi-label-edge',
  template: `<ng-diagram-base-edge
    [edge]="edge()"
    [stroke]="selected() ? 'rebeccapurple' : 'var(--ngd-default-edge-stroke)'"
  >
    <!-- @mark-start -->
    @for (label of animatedLabels(); track label.id) {
      <ng-diagram-base-edge-label
        class="label"
        [id]="label.id"
        [positionOnEdge]="label.positionOnEdge"
        [style]="label.style"
      >
      </ng-diagram-base-edge-label>
    }
    <!-- @mark-end -->
  </ng-diagram-base-edge>`,
  styles: `
    /* @mark-start */
    @keyframes label-animation {
      0% {
        background: aliceblue;
      }

      100% {
        background: rebeccapurple;
      }
    }

    .label {
      width: 1rem;
      height: 1rem;
      border-radius: 100%;
      background: aliceblue;
      animation: label-animation ${ANIMATION_DURATION}s ease-in-out infinite;
    }
    /* @mark-end */
  `,
  imports: [NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent],
})
export class MultipleLabelsEdgeComponent
  implements NgDiagramEdgeTemplate<MultiLabelEdgeData>
{
  edge = input.required<Edge<MultiLabelEdgeData>>();
  selected = computed(() => this.edge().selected);

  // @mark-start
  animatedLabels = computed(() => {
    return Array.from({ length: LABEL_COUNT }, (_, i) => ({
      id: `label-${i}`,
      positionOnEdge: (i + 1) / (LABEL_COUNT + 1),
      style: {
        animationDelay: `${(ANIMATION_DURATION / LABEL_COUNT) * i}s`,
      },
    }));
  });
  // @mark-end
}

type MultiLabelEdgeData = {
  label: string;
};
// @section-end
