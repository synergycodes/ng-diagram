import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { NgDiagramService, NgDiagramViewportService } from 'ng-diagram';

const MIDDLE_BUTTON = 1;
const MIDDLE_BUTTON_MASK = 4;

// Pans the viewport while the middle mouse button is held down.
// Put it on an element that wraps <ng-diagram>: its capture listener runs
// before the listeners of the diagram, so the diagram never sees the press.
@Directive({
  selector: '[middleMousePan]',
  host: {
    '[class.middle-mouse-panning]': 'isPanning()',
    '(mousedown)': 'preventAutoscroll($event)',
  },
})
export class MiddleMousePanDirective {
  private readonly host =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly diagramService = inject(NgDiagramService);
  private readonly viewportService = inject(NgDiagramViewportService);

  readonly isPanning = signal(false);

  private pointerId: number | null = null;
  private lastX = 0;
  private lastY = 0;

  constructor() {
    this.host.addEventListener('pointerdown', this.onPointerDown, {
      capture: true,
    });
    inject(DestroyRef).onDestroy(() => {
      this.host.removeEventListener('pointerdown', this.onPointerDown, {
        capture: true,
      });
      this.stopPanning();
    });
  }

  // Stops the browser's middle-click autoscroll
  preventAutoscroll(event: MouseEvent) {
    if (event.button === MIDDLE_BUTTON) {
      event.preventDefault();
    }
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.button !== MIDDLE_BUTTON) {
      return;
    }
    // Box selection of the diagram does not check the button, so the press must not reach it
    event.preventDefault();
    event.stopPropagation();

    if (this.pointerId !== null || !this.diagramService.isInitialized()) {
      return;
    }
    // With pointer capture, the moves and the release come to the host even outside of it.
    // The capture is released on pointerup and pointercancel, so one listener ends the pan.
    this.host.setPointerCapture(event.pointerId);
    this.pointerId = event.pointerId;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.isPanning.set(true);

    this.host.addEventListener('pointermove', this.onPointerMove);
    this.host.addEventListener('lostpointercapture', this.onLostPointerCapture);
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== this.pointerId) {
      return;
    }
    // With another button still held, the release of the middle one comes as a move
    if ((event.buttons & MIDDLE_BUTTON_MASK) === 0) {
      this.host.releasePointerCapture(event.pointerId);
      this.stopPanning();
      return;
    }
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;

    if (dx !== 0 || dy !== 0) {
      this.viewportService.moveViewportBy(dx, dy);
    }
  };

  private readonly onLostPointerCapture = (event: PointerEvent) => {
    if (event.pointerId === this.pointerId) {
      this.stopPanning();
    }
  };

  private stopPanning() {
    this.host.removeEventListener('pointermove', this.onPointerMove);
    this.host.removeEventListener(
      'lostpointercapture',
      this.onLostPointerCapture
    );
    this.pointerId = null;
    this.isPanning.set(false);
  }
}
