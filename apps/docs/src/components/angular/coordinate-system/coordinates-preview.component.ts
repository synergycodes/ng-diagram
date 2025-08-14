import '@angular/compiler';

import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NgDiagramModelService, NgDiagramViewportService } from '@angularflow/angular-adapter';

@Component({
  selector: 'coordinates-preview',
  imports: [DecimalPipe],
  template: `
    <span>x: {{ viewport().x | number: '1.0-2' }}</span>
    <span>y: {{ viewport().y | number: '1.0-2' }}</span>
    <span>scale: {{ scale() | number: '1.0-2' }}</span>
    <span>selection x: {{ selection()?.nodes[0]?.position?.x || '-' }}</span>
    <span>selection y: {{ selection()?.nodes[0]?.position?.y || '-' }}</span>
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
  private readonly modelService = inject(NgDiagramModelService);

  viewport = this.viewportService.getViewport();
  scale = this.viewportService.getScale();
  selection = this.modelService.getSelection();
}
