import { NgFor, NgIf } from '@angular/common';
import { Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { FlowCoreProviderService } from '../../../../services';
import { BackgroundPatternBase } from '../../background-pattern.base';

interface GridLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  major: boolean;
}

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

  readonly majorLineEvery = 5;
  readonly gridSize = computed(() =>
    this.flowCore.isInitialized() ? (this.flowCore.provide().config.background.gridSize ?? 50) : 50
  );

  override readonly patternTransform = computed(() => {
    const viewport = this.viewport();
    const scale = viewport.scale ?? 1;
    const size = this.gridSize();

    // Offset normalized to the grid size
    const dx = size ? viewport.x % (size * scale) : 0;
    const dy = size ? viewport.y % (size * scale) : 0;

    return `translate(${dx}, ${dy}) scale(${scale})`;
  });

  gridLines(): GridLine[] {
    const size = this.gridSize();
    const step = size / this.majorLineEvery;
    const lines: GridLine[] = [];

    for (let i = 0; i <= size; i += step) {
      const isMajor = Math.round(i / step) % this.majorLineEvery === 0;
      lines.push({ x1: i, y1: 0, x2: i, y2: size, major: isMajor });
      lines.push({ x1: 0, y1: i, x2: size, y2: i, major: isMajor });
    }
    return lines;
  }
}
