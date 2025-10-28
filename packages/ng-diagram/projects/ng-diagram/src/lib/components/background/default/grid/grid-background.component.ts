import { NgFor, NgIf } from '@angular/common';
import { Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { FlowCoreProviderService } from '../../../../services';
import { BackgroundPatternBase } from '../../background-pattern.base';

@Component({
  selector: 'ng-diagram-grid-background',
  standalone: true,
  templateUrl: './grid-background.component.html',
  imports: [NgFor, NgIf],
  styleUrl: './grid-background.component.scss',
})
export class NgDiagramGridBackgroundComponent extends BackgroundPatternBase {
  private readonly flowCore = inject(FlowCoreProviderService);

  protected readonly backgroundPattern = viewChild<ElementRef<SVGPatternElement>>('backgroundPattern');

  gridSize = computed(() => {
    return this.flowCore.isInitialized() ? (this.flowCore.provide().config.background.gridSize ?? 40) : 40;
  });

  gridPattern = computed(() => {
    return this.flowCore.isInitialized()
      ? (this.flowCore.provide().config.background.gridPattern ?? 'simple')
      : 'simple';
  });

  majorLineEvery = 5; // Major line every 5 grid units

  // Used in template for dynamic rendering
  majorMinorLines() {
    const size = this.gridSize();
    const pattern = this.gridPattern();
    const majorEvery = this.majorLineEvery;
    const lines: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];

    // Vertical lines
    for (let i = 0; i <= size; i += size / majorEvery) {
      const isMajor = Math.round(i) % size === 0 || Math.round(i / (size / majorEvery)) % majorEvery === 0;
      lines.push({ x1: i, y1: 0, x2: i, y2: size, major: pattern === 'major-minor' && isMajor });
    }
    // Horizontal lines
    for (let i = 0; i <= size; i += size / majorEvery) {
      const isMajor = Math.round(i) % size === 0 || Math.round(i / (size / majorEvery)) % majorEvery === 0;
      lines.push({ x1: 0, y1: i, x2: size, y2: i, major: pattern === 'major-minor' && isMajor });
    }
    return lines;
  }

  simpleGridLines = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  ];
}
