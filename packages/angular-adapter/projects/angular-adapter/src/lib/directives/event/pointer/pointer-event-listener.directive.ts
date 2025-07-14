import { Directive, inject, input, OnDestroy } from '@angular/core';
import type { EventTarget, EventType } from '@angularflow/core';
import { EventMapperService } from '../../../services';
import { ITargetedEventListener } from '../../../types';

@Directive({
  selector: '[angularAdapterPointerEventListener]',
  exportAs: 'pointerTracker',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'onPointerCancel($event)',
  },
})
export class PointerEventListenerDirective implements ITargetedEventListener, OnDestroy {
  private readonly eventMapperService = inject(EventMapperService);

  eventTarget = input<EventTarget>({ type: 'diagram' });
  eventName = input<EventType>('unknown');

  // Track active pointer for drag operations
  private activePointerId: number | null = null;
  private isDragging = false;

  // Public getter to expose dragging state
  get isCurrentlyDragging(): boolean {
    return this.isDragging;
  }

  onPointerDown(event: PointerEvent) {
    event.stopPropagation();

    // Capture the pointer for global tracking
    const currentTarget = event.currentTarget as HTMLElement;
    currentTarget.setPointerCapture(event.pointerId);

    // Start tracking this pointer
    this.activePointerId = event.pointerId;
    this.isDragging = true;

    this.eventMapperService.emit(event, {
      name: this.eventName(),
      target: this.eventTarget(),
    });
  }

  onPointerMove(event: PointerEvent) {
    // Only handle move events for the active pointer during drag
    if (!this.isDragging || this.activePointerId !== event.pointerId) {
      return;
    }

    // Prevent default behavior and ensure isolation
    event.preventDefault();
    event.stopPropagation();

    this.eventMapperService.emit(event, {
      name: this.eventName(),
      target: this.eventTarget(),
    });
  }

  onPointerUp(event: PointerEvent) {
    // Only handle up events for the active pointer
    if (this.activePointerId !== event.pointerId) {
      // Still emit for non-dragging pointer ups
      event.stopPropagation();
      this.eventMapperService.emit(event, {
        name: this.eventName(),
        target: this.eventTarget(),
      });
      return;
    }

    event.stopPropagation();

    this.eventMapperService.emit(event, {
      name: this.eventName(),
      target: this.eventTarget(),
    });

    // Clean up tracking
    this.cleanup();
  }

  onPointerCancel(event: PointerEvent) {
    // Handle pointer cancel (important for touch devices)
    if (this.activePointerId !== event.pointerId) {
      return;
    }

    event.stopPropagation();

    this.eventMapperService.emit(event, {
      name: this.eventName(),
      target: this.eventTarget(),
    });

    this.cleanup();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private cleanup(): void {
    this.activePointerId = null;
    this.isDragging = false;
  }
}
