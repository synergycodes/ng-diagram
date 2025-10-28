import { Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { FlowCoreProviderService } from '../../../../services';
import { BackgroundPatternBase } from '../../background-pattern.base';

@Component({
  selector: 'ng-diagram-grid-background',
  standalone: true,
  templateUrl: './grid-background.component.html',
  styleUrl: './grid-background.component.scss',
})
export class NgDiagramGridBackgroundComponent extends BackgroundPatternBase {
  private readonly flowCore = inject(FlowCoreProviderService);
  protected readonly backgroundPattern = viewChild<ElementRef<SVGPatternElement>>('backgroundPattern');

  /** podstawowy rozmiar kratki */
  gridSize = computed(() => {
    return this.flowCore.isInitialized() ? (this.flowCore.provide().config.background.gridSize ?? 50) : 50;
  });

  override size = computed(() => {
    const pattern = this.backgroundPattern();
    const widthAttr = pattern?.nativeElement.getAttribute('staticWidth');
    console.log(widthAttr, this.viewport().scale);
    return Number(widthAttr) * this.viewport().scale;
  });

  /** co ile kratek linia major */
  majorLineEvery = 10;

  /** kolory siatki */
  minorStroke = 'var(--ngd-background-line-minor, #e0e0e0)';
  majorStroke = 'var(--ngd-background-line-major, #b0b0b0)';

  /**
   * 🔧 Ustawiamy patternTransform tak, aby:
   * - NIE przesuwać (translate)
   * - skalować zgodnie z aktualnym zoomem
   */
  override patternTransform = computed(() => {
    const viewport = this.viewportService.viewport();
    const scale = viewport.scale ?? 1;
    return `scale(${scale})`;
  });

  gridLines() {
    const size = this.gridSize();
    const step = size / this.majorLineEvery;
    const lines: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];

    for (let i = 0; i <= size; i += step) {
      const isMajor = Math.round(i / step) % this.majorLineEvery === 0;
      lines.push({ x1: i, y1: 0, x2: i, y2: size, major: isMajor });
      lines.push({ x1: 0, y1: i, x2: size, y2: i, major: isMajor });
    }

    return lines;
  }
}
