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

      /* The preview edge ends under the pointer. Catching it there would flip
         the cursor and :hover between the preview and whatever lies beneath.
         Held on the wrapper so it covers custom edge templates too; a
         descendant that sets its own pointer-events still opts back in. */
      :host.ng-diagram-edge--temporary {
        pointer-events: none;
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
    // Styling hook for the preview edge drawn during a draw or relink — also
    // what makes the preview non-interactive, whatever template renders it.
    '[class.ng-diagram-edge--temporary]': 'temporary()',
  },
})
export class NgDiagramEdgeComponent {
  edge = input.required<Edge>();

  protected readonly dangling = computed(() => {
    const edge = this.edge();
    return isDanglingEdge(edge) && !edge.temporary;
  });

  protected readonly temporary = computed(() => !!this.edge().temporary);
}
