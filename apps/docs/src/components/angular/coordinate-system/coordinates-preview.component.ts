import '@angular/compiler';

import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import {
  NgDiagramSelectionService,
  NgDiagramViewportService,
} from 'ng-diagram';

@Component({
  selector: 'coordinates-preview',
  imports: [DecimalPipe],
  template: `
    <span>x: {{ viewport().x | number: '1.0-2' }}</span>
    <span>y: {{ viewport().y | number: '1.0-2' }}</span>
    <span>scale: {{ scale() | number: '1.0-2' }}</span>
    <span
      >selection x:
      {{
        selectionPosition() != null
          ? (selectionPosition().x | number: '1.0-2')
          : '-'
      }}</span
    >
    <span
      >selection y:
      {{
        selectionPosition() != null
          ? (selectionPosition().y | number: '1.0-2')
          : '-'
      }}</span
    >
  `,
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
export class CoordinatesPreview {
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly selectionService = inject(NgDiagramSelectionService);

  viewport = this.viewportService.viewport;
  scale = this.viewportService.scale;
  selectionPosition = computed(
    () => this.selectionService.selection().nodes[0]?.position
  );
}
