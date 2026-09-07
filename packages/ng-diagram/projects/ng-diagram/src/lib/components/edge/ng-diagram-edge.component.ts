import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Edge } from '../../../core/src';

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
  },
})
export class NgDiagramEdgeComponent {
  edge = input.required<Edge>();
}
