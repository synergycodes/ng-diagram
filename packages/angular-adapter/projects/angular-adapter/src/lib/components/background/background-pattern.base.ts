// background-pattern.base.ts
import { effect, inject } from '@angular/core';
import { Viewport } from '@angularflow/core';
import { NgDiagramService } from '../../services/ng-diagram.service';
import { AppMiddlewares } from '../../utils/create-middlewares';

export abstract class BackgroundPatternBase {
  private readonly ngDiagramService: NgDiagramService<AppMiddlewares> = inject(NgDiagramService<AppMiddlewares>);

  protected setupPatternEffect() {
    effect(() => {
      const model = this.ngDiagramService.getModel();
      const { viewport } = model.getMetadata();

      if (viewport) {
        const backgroundPattern = this.getBackgroundPattern();
        if (backgroundPattern) {
          const size = this.getPatternSize(backgroundPattern, viewport.scale);
          this.setPatternSize(backgroundPattern, size);
          this.setPatternTransform(backgroundPattern, viewport, size);
          this.setPatternFill(backgroundPattern, viewport.scale);
        }
      }
    });
  }

  private getBackgroundPattern(): SVGPatternElement | null {
    return document.getElementById('ng-diagram-background') as SVGPatternElement | null;
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
