import { Directive, ElementRef, inject, type OnDestroy } from '@angular/core';
import { NgDiagramService } from '../../../public-services/ng-diagram.service';
import { FlowCoreProviderService } from '../../../services/flow-core-provider/flow-core-provider.service';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import type { PointerInputEvent, WheelInputEvent } from '../../../types';
import { shouldDiscardEvent } from '../utils/should-discard-event';

@Directive({
  selector: '[ngDiagramPanning]',
  standalone: true,
  host: {
    '(pointerdown)': 'onPointerDown($event)',
    '(wheel)': 'onWheel($event)',
  },
})
export class PanningDirective implements OnDestroy {
  private readonly inputEventsRouter = inject(InputEventsRouterService);
  private readonly elementRef = inject(ElementRef);
  private readonly diagramService = inject(NgDiagramService);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  private unregisterInteractionCleanup: (() => void) | null = null;

  ngOnDestroy(): void {
    this.removeListeners();
  }

  onPointerDown(event: PointerInputEvent): void {
    // ignore on mobile touch devices
    if (event.pointerType === 'touch') {
      return;
    }
    if (!this.inputEventsRouter.eventGuards.withPrimaryButton(event) || !this.shouldHandle(event)) {
      return;
    }
    this.toggleGrabbingCursor(true);

    event.preventDefault();
    event.stopPropagation();

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'panning',
      phase: 'start',
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });

    document.addEventListener('pointermove', this.onMouseMove);
    document.addEventListener('pointerup', this.onPointerUp);
    this.unregisterInteractionCleanup = this.flowCoreProvider
      .provide()
      .registerInteractionCleanup(() => this.removeListeners());
  }

  onPointerUp = (event: PointerEvent): void => {
    if (!this.inputEventsRouter.eventGuards.withPrimaryButton(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.finishPanning(event);
  };

  onWheel(event: WheelInputEvent): void {
    if (!this.shouldHandleWheel(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    let { deltaX, deltaY } = event;

    if (event.shiftKey && deltaX === 0 && deltaY !== 0) {
      deltaX = deltaY;
      deltaY = 0;
    }

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'wheelPanning',
      deltaX,
      deltaY,
    });
  }

  private onMouseMove = (event: PointerInputEvent) => {
    if (event.zoomingHandled) {
      this.finishPanning(event);
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'panning',
      phase: 'continue',
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  };

  private removeListeners(): void {
    this.unregisterInteractionCleanup?.();
    this.unregisterInteractionCleanup = null;
    document.removeEventListener('pointermove', this.onMouseMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    this.toggleGrabbingCursor(false);
  }

  private finishPanning(event: PointerInputEvent): void {
    this.removeListeners();

    const baseEvent = this.inputEventsRouter.getBaseEvent(event);
    this.inputEventsRouter.emit({
      ...baseEvent,
      name: 'panning',
      phase: 'end',
      target: undefined,
      targetType: 'diagram',
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  }

  private shouldHandle(event: PointerInputEvent): boolean {
    const { viewportPanningEnabled } = this.diagramService.config();
    if (!viewportPanningEnabled || shouldDiscardEvent(event, 'pan')) {
      return false;
    }

    return !(
      event.moveSelectionHandled ||
      event.zoomingHandled ||
      event.linkingHandled ||
      event.rotateHandled ||
      event.boxSelectionHandled
    );
  }

  private shouldHandleWheel(event: WheelInputEvent): boolean {
    const { viewportPanningEnabled } = this.diagramService.config();
    if (!viewportPanningEnabled || event.zoomingHandled || shouldDiscardEvent(event, 'pan')) {
      return false;
    }

    if (this.flowCoreProvider.provide().actionStateManager.isPanning()) {
      return true;
    }

    return !this.inputEventsRouter.eventGuards.withPrimaryModifier(event) && !event.ctrlKey;
  }

  private toggleGrabbingCursor(isGrabbing: boolean): void {
    const diagramElement = this.elementRef.nativeElement;
    diagramElement.classList.toggle('panning', isGrabbing);
  }
}
