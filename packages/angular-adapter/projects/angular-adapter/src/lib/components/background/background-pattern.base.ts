import { effect, ElementRef, inject, Signal } from '@angular/core';
import { Viewport } from '@angularflow/core';
import { FlowCoreProviderService } from '../../services';

export abstract class BackgroundPatternBase {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  protected abstract readonly backgroundPattern: Signal<ElementRef<SVGPatternElement> | undefined>;

  constructor() {
    effect(() => {
      const viewport = this.flowCoreProvider.provide().getViewport();

      if (viewport) {
        const pattern = this.backgroundPattern();
        if (!pattern) return;

        const size = this.getPatternSize(pattern.nativeElement, viewport.scale);
        this.setPatternSize(pattern.nativeElement, size);
        this.setPatternTransform(pattern.nativeElement, viewport, size);
        this.setPatternFill(pattern.nativeElement, viewport.scale);
      }
    });
  }

  private getPatternSize(pattern: SVGPatternElement, scale: number): number {
    const widthAttr = pattern.getAttribute('staticWidth');
    return Number(widthAttr) * scale;
  }

  private setPatternSize(pattern: SVGPatternElement, size: number): void {
    pattern.setAttribute('width', String(size));
    pattern.setAttribute('height', String(size));
  }

  private setPatternTransform(pattern: SVGPatternElement, viewport: Viewport, size: number): void {
    const dx = viewport.x % size;
    const dy = viewport.y % size;
    pattern.setAttribute('patternTransform', `translate(${dx},${dy})`);
  }

  private setPatternFill(pattern: SVGPatternElement, scale: number): void {
    if (scale < 0.4) {
      pattern.setAttribute('fill', 'none');
    } else {
      pattern.setAttribute('fill', 'var(--ngd-background-dot-color)');
    }
  }
}
