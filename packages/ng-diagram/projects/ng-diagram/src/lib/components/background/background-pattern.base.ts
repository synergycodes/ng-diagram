import { computed, ElementRef, inject, Signal } from '@angular/core';
import { NgDiagramViewportService } from '../../public-services/ng-diagram-viewport.service';

export abstract class BackgroundPatternBase {
  private readonly viewportService = inject(NgDiagramViewportService);

  protected abstract readonly backgroundPattern: Signal<ElementRef<SVGPatternElement> | undefined>;

  private viewport = this.viewportService.viewport;

  size = computed(() => {
    const pattern = this.backgroundPattern();
    const widthAttr = pattern?.nativeElement.getAttribute('staticWidth');

    return Number(widthAttr) * this.viewport().scale;
  });

  fill = computed(() => {
    return this.viewport().scale > 0.3 ? 'var(--ngd-background-dot-color)' : 'none';
  });

  fillOpacity = computed(() => {
    return this.viewport().scale - 0.2;
  });

  patternTransform = computed(() => {
    const size = this.size();
    const viewport = this.viewport();

    const dx = size ? viewport.x % size : 0;
    const dy = size ? viewport.y % size : 0;

    return `translate(${dx},${dy})`;
  });
}
