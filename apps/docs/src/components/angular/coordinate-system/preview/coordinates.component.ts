// @collapse-start
import '@angular/compiler';

import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import {
  NgDiagramSelectionService,
  NgDiagramViewportService,
} from 'ng-diagram';
// @collapse-end

@Component({
  selector: 'coordinates',
  imports: [DecimalPipe],
  templateUrl: './coordinates.component.html',
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      position: absolute;
      padding: 0.5rem;
      color: var(--ngd-txt-primary-default);
    }
  `,
})
export class CoordinatesComponent {
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly selectionService = inject(NgDiagramSelectionService);

  viewport = this.viewportService.viewport;
  scale = this.viewportService.scale;
  selectionPosition = computed(
    () => this.selectionService.selection().nodes[0]?.position
  );
}
