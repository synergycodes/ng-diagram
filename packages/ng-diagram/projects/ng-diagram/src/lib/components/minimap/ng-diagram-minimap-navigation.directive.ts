import { Directive, inject, input, OnDestroy } from '@angular/core';
import { Viewport } from '../../../core/src';
import { NgDiagramViewportService } from '../../public-services/ng-diagram-viewport.service';
import { MinimapTransform } from './ng-diagram-minimap.types';

interface Point {
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  lastPosition: Point;
  pointerId: number | null;
}

/**
 * Directive that enables drag navigation on the minimap.
 * Users can drag on the minimap to move the diagram viewport.
 *
 * Supports both mouse and touch input.
 * Uses pointer capture for reliable touch tracking on mobile devices.
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

  private dragState: DragState = {
    isDragging: false,
    lastPosition: { x: 0, y: 0 },
    pointerId: null,
  };

  ngOnDestroy(): void {
    this.removeDocumentListeners();
  }

  onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    this.capturePointer(event);
    this.dragState.isDragging = true;
    this.dragState.lastPosition = { x: event.clientX, y: event.clientY };
    this.attachDocumentListeners();
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.dragState.isDragging) {
      return;
    }

    const delta = this.calculateClientDelta(event);
    this.dragState.lastPosition = { x: event.clientX, y: event.clientY };

    const viewportDelta = this.calculateViewportDelta(delta);
    this.viewportService.moveViewportBy(viewportDelta.x, viewportDelta.y);
  };

  private onPointerUp = (event: PointerEvent): void => {
    this.dragState.isDragging = false;
    this.releasePointer(event);
    this.removeDocumentListeners();
  };

  private capturePointer(event: PointerEvent): void {
    const target = event.target as Element;
    target.setPointerCapture(event.pointerId);
    this.dragState.pointerId = event.pointerId;
  }

  private releasePointer(event: PointerEvent): void {
    if (this.dragState.pointerId === null) {
      return;
    }

    const target = event.target as Element;
    if (target.hasPointerCapture(this.dragState.pointerId)) {
      target.releasePointerCapture(this.dragState.pointerId);
    }
    this.dragState.pointerId = null;
  }

  private attachDocumentListeners(): void {
    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
    document.addEventListener('pointercancel', this.onPointerUp);
  }

  private removeDocumentListeners(): void {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    document.removeEventListener('pointercancel', this.onPointerUp);
  }

  private calculateClientDelta(event: PointerEvent): Point {
    return {
      x: event.clientX - this.dragState.lastPosition.x,
      y: event.clientY - this.dragState.lastPosition.y,
    };
  }

  private calculateViewportDelta(clientDelta: Point): Point {
    const { scale: minimapScale } = this.transform();
    const { scale: viewportScale } = this.viewport();

    return {
      x: -(clientDelta.x / minimapScale) * viewportScale,
      y: -(clientDelta.y / minimapScale) * viewportScale,
    };
  }
}
