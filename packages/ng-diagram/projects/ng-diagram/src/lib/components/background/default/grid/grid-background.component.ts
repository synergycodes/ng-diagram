import { Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { Point, Size } from '../../../../../core/src';
import { NgDiagramService } from '../../../../../public-api';
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
})
export class NgDiagramGridBackgroundComponent extends BackgroundPatternBase {
  private readonly flowCore = inject(FlowCoreProviderService);
  private readonly diagramService = inject(NgDiagramService);

  protected readonly backgroundPattern = viewChild<ElementRef<SVGPatternElement>>('backgroundPattern');

  // Size of the smallest grid cell (minor grid spacing)
  readonly cellSize = computed<Size>(() => {
    const defaultSize = { width: 10, height: 10 };
    if (!this.flowCore.isInitialized()) {
      return defaultSize;
    }

    const cellSize = this.diagramService.config().background?.cellSize;
    return cellSize ?? defaultSize;
  });

  // How often major lines appear (in number of minor cells)
  readonly majorLinesFrequency = computed<Point>(() => {
    const defaultFrequency = { x: 5, y: 5 };
    if (!this.flowCore.isInitialized()) {
      return defaultFrequency;
    }

    const majorLinesFrequency = this.diagramService.config().background?.majorLinesFrequency;
    return majorLinesFrequency ?? defaultFrequency;
  });

  // Pattern size is the major grid cell (contains NxM minor cells)
  readonly patternSize = computed<Size>(() => {
    const size = this.cellSize();
    const frequency = this.majorLinesFrequency();
    return {
      width: size.width * frequency.x,
      height: size.height * frequency.y,
    };
  });

  override readonly patternTransform = computed(() => {
    const viewport = this.viewport();
    const scale = viewport.scale ?? 1;
    const patternSize = this.patternSize();

    const dx = patternSize.width ? viewport.x % (patternSize.width * scale) : 0;
    const dy = patternSize.height ? viewport.y % (patternSize.height * scale) : 0;

    return `translate(${dx}, ${dy}) scale(${scale})`;
  });

  gridLines(): GridLine[] {
    const minorCellSize = this.cellSize();
    const majorCellSize = this.patternSize();
    const lines: GridLine[] = [];

    for (let x = 0; x <= majorCellSize.width; x += minorCellSize.width) {
      const isMajor = x % majorCellSize.width === 0;
      lines.push({
        x1: x,
        y1: 0,
        x2: x,
        y2: majorCellSize.height,
        major: isMajor,
      });
    }

    for (let y = 0; y <= majorCellSize.height; y += minorCellSize.height) {
      const isMajor = y % majorCellSize.height === 0;
      lines.push({
        x1: 0,
        y1: y,
        x2: majorCellSize.width,
        y2: y,
        major: isMajor,
      });
    }

    return lines;
  }
}
