import { NgFor, NgIf } from '@angular/common';
import { Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { FlowCoreProviderService } from '../../../../services';
import { BackgroundPatternBase } from '../../background-pattern.base';

@Component({
  selector: 'ng-diagram-grid-background',
  standalone: true,
  templateUrl: './grid-background.component.html',
  styleUrl: './grid-background.component.scss',
  imports: [NgFor, NgIf],
})
export class NgDiagramGridBackgroundComponent extends BackgroundPatternBase {
  private readonly flowCore = inject(FlowCoreProviderService);
  protected readonly backgroundPattern = viewChild<ElementRef<SVGPatternElement>>('backgroundPattern');

  /** rozmiar pojedynczej kratki w jednostkach bazowych */
  gridSize = computed(() => {
    return this.flowCore.isInitialized() ? (this.flowCore.provide().config.background.gridSize ?? 50) : 50;
  });

  /** co ile kratek ma być linia grubsza */
  majorLineEvery = 5;

  /** kolory siatki */
  minorStroke = 'var(--ngd-background-line-minor, #c2c0c0ff)';
  majorStroke = 'var(--ngd-background-line-major, #989898ff)';

  /**
   * 🔧 Siatka porusza się z panem i skaluje z zoomem.
   *  - translate() zapewnia przesuwanie
   *  - scale() zapewnia skalowanie
   */
  override patternTransform = computed(() => {
    const viewport = this.viewportService.viewport();
    const scale = viewport.scale ?? 1;
    const size = this.gridSize();

    // przesunięcie zgodne z pozycją viewportu, ale znormalizowane do rozmiaru kratki
    const dx = size ? viewport.x % (size * scale) : 0;
    const dy = size ? viewport.y % (size * scale) : 0;

    // kolejność: najpierw translacja, potem skalowanie
    return `translate(${dx}, ${dy}) scale(${scale})`;
  });

  /** generowanie linii siatki (minor + major) */
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
