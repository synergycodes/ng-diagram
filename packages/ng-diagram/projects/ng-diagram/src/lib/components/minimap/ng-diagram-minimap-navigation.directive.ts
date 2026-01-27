import { Directive, inject, input, OnDestroy } from '@angular/core';
import { Viewport } from '../../../core/src';
import { NgDiagramViewportService } from '../../public-services/ng-diagram-viewport.service';
import { MinimapTransform } from './ng-diagram-minimap.types';

/**
 * Directive that enables drag navigation on the minimap.
 * Users can drag on the minimap to move the diagram viewport.
 *
 * @public
 * @since 1.0.0
 * @category Directives
 */
@Directive({
  selector: '[ngDiagramMinimapNavigation]',
  standalone: true,
  host: {
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class NgDiagramMinimapNavigationDirective implements OnDestroy {
  private readonly viewportService = inject(NgDiagramViewportService);

  transform = input.required<MinimapTransform>();
  viewport = input.required<Viewport>();

  private isDragging = false;
  private lastClientX = 0;
  private lastClientY = 0;

  ngOnDestroy(): void {
    this.removeDocumentListeners();
  }

  onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    this.isDragging = true;
    this.lastClientX = event.clientX;
    this.lastClientY = event.clientY;

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.isDragging) {
      return;
    }

    const deltaX = event.clientX - this.lastClientX;
    const deltaY = event.clientY - this.lastClientY;

    this.lastClientX = event.clientX;
    this.lastClientY = event.clientY;

    const transform = this.transform();
    const viewport = this.viewport();

    const diagramDeltaX = deltaX / transform.scale;
    const diagramDeltaY = deltaY / transform.scale;

    this.viewportService.moveViewportBy(-diagramDeltaX * viewport.scale, -diagramDeltaY * viewport.scale);
  };

  private onPointerUp = (): void => {
    this.isDragging = false;
    this.removeDocumentListeners();
  };

  private removeDocumentListeners(): void {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
  }
}
