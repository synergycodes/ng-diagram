import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import {
  NgDiagramService,
  NgDiagramViewportService,
  type Point,
} from 'ng-diagram';
import { focusDiagram } from './focus-diagram';

const MIDDLE_BUTTON = 1;
const MIDDLE_BUTTON_MASK = 4;

// Pans the viewport while the middle mouse button is held down.
// Put it on an element that wraps <ng-diagram>: its capture listener runs
// before the listeners of the diagram, so the diagram never sees the press.
@Directive({
  selector: '[middleMousePan]',
  host: {
    '[class.middle-mouse-panning]': 'isPanning()',
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
  private pendingMove: Point = { x: 0, y: 0 };
  private isMoving = false;

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

  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.button !== MIDDLE_BUTTON) {
      return;
    }
    // The middle press only pans, so it must not start a gesture of the diagram.
    // preventDefault() also stops the browser's middle-click autoscroll.
    event.preventDefault();
    event.stopPropagation();

    if (this.pointerId !== null || !this.diagramService.isInitialized()) {
      return;
    }
    focusDiagram(this.host);
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
    this.pendingMove = {
      x: this.pendingMove.x + event.clientX - this.lastX,
      y: this.pendingMove.y + event.clientY - this.lastY,
    };
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    void this.applyPendingMove();
  };

  private readonly onLostPointerCapture = (event: PointerEvent) => {
    if (event.pointerId === this.pointerId) {
      this.stopPanning();
    }
  };

  // moveViewportBy() adds to the current viewport, so each call waits for the previous one.
  // Moves that come in the meantime are added up and sent in the next call.
  private async applyPendingMove() {
    if (this.isMoving) {
      return;
    }
    this.isMoving = true;
    try {
      while (this.pendingMove.x !== 0 || this.pendingMove.y !== 0) {
        const { x, y } = this.pendingMove;
        this.pendingMove = { x: 0, y: 0 };
        await this.viewportService.moveViewportBy(x, y);
      }
    } finally {
      this.isMoving = false;
    }
  }

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
