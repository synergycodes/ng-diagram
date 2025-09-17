import { computed, ElementRef, inject, Signal } from '@angular/core';
import { NgDiagramViewportService } from '../../public-services/ng-diagram-viewport.service';
import { FlowCoreProviderService } from '../../services';

export abstract class BackgroundPatternBase {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
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
    const dx = this.viewport().x % this.size();
    const dy = this.viewport().y % this.size();

    return `translate(${dx},${dy})`;
  });
}
