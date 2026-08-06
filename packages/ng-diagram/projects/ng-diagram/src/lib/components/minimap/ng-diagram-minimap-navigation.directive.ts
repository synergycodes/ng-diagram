import { Directive, inject, input, OnDestroy } from '@angular/core';
import { Viewport } from '../../../core/src';
import { NgDiagramViewportService } from '../../public-services/ng-diagram-viewport.service';
import { FlowCoreProviderService } from '../../services';
import { MinimapTransform } from './ng-diagram-minimap.types';

interface Point {
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  lastPosition: Point;
  pointerId: number | null;
  /** Kept so the cancel path can release the capture without an event. */
  captureElement: Element | null;
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
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  transform = input.required<MinimapTransform>();
  viewport = input.required<Viewport>();

  private dragState: DragState = {
    isDragging: false,
    lastPosition: { x: 0, y: 0 },
    pointerId: null,
    captureElement: null,
  };

  private unregisterInteractionCleanup: (() => void) | null = null;

  ngOnDestroy(): void {
    // Destroyed mid-drag: the pointerup will never come, so the panning state
    // this directive set must be cleared here.
    if (this.dragState.isDragging && this.flowCoreProvider.isInitialized()) {
      this.setPanningState(false);
    }
    this.removeListeners();
  }

  onPointerDown(event: PointerEvent): void {
    // Re-entry guard: a second pointerdown mid-gesture would orphan the previous interaction-cleanup registration.
    if (event.button !== 0 || this.dragState.isDragging) {
      return;
    }

    event.preventDefault();

    this.capturePointer(event);
    this.dragState.isDragging = true;
    this.dragState.lastPosition = { x: event.clientX, y: event.clientY };
    this.setPanningState(true);
    this.attachDocumentListeners();
    // cancelActiveInteraction() must be able to stop a minimap drag like any
    // other pan: core clears the panning state, this cleanup tears down the
    // listeners and the pointer capture.
    this.unregisterInteractionCleanup = this.flowCoreProvider
      .provide()
      .registerInteractionCleanup(() => this.removeListeners());
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

  private onPointerUp = (): void => {
    this.setPanningState(false);
    this.removeListeners();
  };

  private removeListeners(): void {
    this.unregisterInteractionCleanup?.();
    this.unregisterInteractionCleanup = null;
    this.dragState.isDragging = false;
    this.releasePointer();
    this.removeDocumentListeners();
  }

  private capturePointer(event: PointerEvent): void {
    const target = event.target as Element;
    target.setPointerCapture(event.pointerId);
    this.dragState.pointerId = event.pointerId;
    this.dragState.captureElement = target;
  }

  private releasePointer(): void {
    const { captureElement, pointerId } = this.dragState;
    if (captureElement && pointerId !== null && captureElement.hasPointerCapture(pointerId)) {
      captureElement.releasePointerCapture(pointerId);
    }
    this.dragState.pointerId = null;
    this.dragState.captureElement = null;
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

  private setPanningState(active: boolean): void {
    const actionStateManager = this.flowCoreProvider.provide().actionStateManager;
    if (active) {
      actionStateManager.panning = { active: true };
    } else {
      actionStateManager.clearPanning();
    }
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
