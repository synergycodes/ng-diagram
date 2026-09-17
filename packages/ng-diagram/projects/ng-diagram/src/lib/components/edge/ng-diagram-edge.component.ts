import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Edge, isDanglingEdge } from '../../../core/src';

@Component({
  selector: 'ng-diagram-edge',
  standalone: true,
  template: '<ng-content />',
  styles: [
    `
      :host {
        position: absolute;
        user-select: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Effectively hidden edges stay mounted as display: none so unhiding
    // re-measures labels through the existing ResizeObserver path. Visible
    // edges get no inline display value — user CSS stays in charge.
    '[style.display]': 'edge().computedHidden ? "none" : null',
    // Styling hook for edges with a free (unconnected) endpoint — lets apps
    // style dangling edges without inspecting the model.
    '[class.ng-diagram-edge--dangling]': 'dangling()',
  },
})
export class NgDiagramEdgeComponent {
  edge = input.required<Edge>();

  protected readonly dangling = computed(() => {
    const edge = this.edge();
    return isDanglingEdge(edge) && !edge.temporary;
  });
}
