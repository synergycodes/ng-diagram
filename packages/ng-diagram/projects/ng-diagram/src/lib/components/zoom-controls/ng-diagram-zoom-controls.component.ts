import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgDiagramViewportService } from '../../public-services/ng-diagram-viewport.service';

/**
 * A zoom controls component that displays zoom in/out buttons and current zoom level.
 */
@Component({
  selector: 'ng-diagram-zoom-controls',
  standalone: true,
  template: `
    <div class="zoom-controls-container">
      <button class="nav-button" [disabled]="!canZoomOut()" (click)="zoomOut()" aria-label="Zoom out">−</button>
      <span class="label">{{ zoomPercentage() }}%</span>
      <button class="nav-button" [disabled]="!canZoomIn()" (click)="zoomIn()" aria-label="Zoom in">+</button>
    </div>
  `,
  styleUrls: ['./ng-diagram-zoom-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgDiagramZoomControlsComponent {
  private readonly viewportService = inject(NgDiagramViewportService);

  step = input<number>(0.1);

  zoomPercentage = computed(() => Math.round(this.viewportService.scale() * 100));

  canZoomIn = computed(() => {
    const newScale = this.viewportService.scale() + this.step();
    return newScale <= this.viewportService.maxZoom;
  });

  canZoomOut = computed(() => {
    const newScale = this.viewportService.scale() - this.step();
    return newScale >= this.viewportService.minZoom;
  });

  zoomIn(): void {
    const currentScale = this.viewportService.scale();
    const factor = (currentScale + this.step()) / currentScale;
    this.viewportService.zoom(factor);
  }

  zoomOut(): void {
    const currentScale = this.viewportService.scale();
    const factor = (currentScale - this.step()) / currentScale;
    this.viewportService.zoom(factor);
  }
}
