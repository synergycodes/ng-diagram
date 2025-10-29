import { NgFor, NgIf } from '@angular/common';
import { Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { Point } from '../../../../../core/src';
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

  // Size of the smallest grid cell (minor grid spacing)
  readonly gridSize = computed<Point>(() => {
    if (!this.flowCore.isInitialized()) {
      return { x: 10, y: 10 };
    }
    const config = this.flowCore.provide().config.background.gridSize;
    return config ?? { x: 10, y: 10 };
  });

  // How often major lines appear (in number of minor cells)
  readonly majorLinesFrequency = computed<{ x: number; y: number }>(() => {
    if (!this.flowCore.isInitialized()) {
      return { x: 5, y: 5 };
    }
    const config = this.flowCore.provide().config.background.majorLinesFrequency;
    return config ?? { x: 5, y: 5 };
  });

  // Pattern size is the major grid cell (contains NxM minor cells)
  readonly patternSize = computed<Point>(() => {
    const size = this.gridSize();
    const frequency = this.majorLinesFrequency();
    return {
      x: size.x * frequency.x,
      y: size.y * frequency.y,
    };
  });

  override readonly patternTransform = computed(() => {
    const viewport = this.viewport();
    const scale = viewport.scale ?? 1;
    const patternSize = this.patternSize();

    const dx = patternSize.x ? viewport.x % (patternSize.x * scale) : 0;
    const dy = patternSize.y ? viewport.y % (patternSize.y * scale) : 0;

    return `translate(${dx}, ${dy}) scale(${scale})`;
  });

  gridLines(): GridLine[] {
    const minorGridSize = this.gridSize();
    const majorGridSize = this.patternSize();
    const lines: GridLine[] = [];

    for (let x = 0; x <= majorGridSize.x; x += minorGridSize.x) {
      const isMajor = x % majorGridSize.x === 0;
      lines.push({
        x1: x,
        y1: 0,
        x2: x,
        y2: majorGridSize.y,
        major: isMajor,
      });
    }

    for (let y = 0; y <= majorGridSize.y; y += minorGridSize.y) {
      const isMajor = y % majorGridSize.y === 0;
      lines.push({
        x1: 0,
        y1: y,
        x2: majorGridSize.x,
        y2: y,
        major: isMajor,
      });
    }

    return lines;
  }
}
