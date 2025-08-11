import { computed, ElementRef, inject, Signal } from '@angular/core';
import { FlowCoreProviderService } from '../../services';

export abstract class BackgroundPatternBase {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  protected abstract readonly backgroundPattern: Signal<ElementRef<SVGPatternElement> | undefined>;

  private viewport = computed(() => this.flowCoreProvider.provide().getViewport());

  size = computed(() => {
    const pattern = this.backgroundPattern();
    const widthAttr = pattern?.nativeElement.getAttribute('staticWidth');

    return Number(widthAttr) * this.viewport().scale;
  });

  fill = computed(() => {
    return this.viewport().scale > 0.4 ? 'var(--ngd-background-dot-color)' : 'none';
  });

  patternTransform = computed(() => {
    const dx = this.viewport().x % this.size();
    const dy = this.viewport().y % this.size();

    return `translate(${dx},${dy})`;
  });
}
