import { inject, Injectable } from '@angular/core';
import { Node, Point } from '../../../core/src';
import { PointerInputEvent } from '../../types';
import { CursorPositionTrackerService } from '../cursor-position-tracker/cursor-position-tracker.service';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';
import { LinkingEventService } from './linking-event.service';
import { LinkingGestureStateService } from './linking-gesture-state.service';

@Injectable()
export class ManualLinkingService {
  private readonly linkingEventService = inject(LinkingEventService);
  private readonly cursorPositionTrackerService = inject(CursorPositionTrackerService);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly linkingGestureState = inject(LinkingGestureStateService);
  private node: Node | undefined;
  private portId: string | undefined;
  private unregisterInteractionCleanup: (() => void) | null = null;

  /** Call this method to start linking from your custom logic */
  startLinking(node: Node, portId?: string) {
    // Validate BEFORE attaching document listeners or emitting — an
    // effectively hidden source is refused by the startLinking command, and
    // listeners attached here would be orphaned until the next click.
    const flowCore = this.flowCoreProvider.provide();
    if (flowCore.actionStateManager.isLinking()) {
      console.warn('[ngDiagram] startLinking ignored: another linking or relinking gesture is in progress.');
      return;
    }
    const currentNode = flowCore.getNodeById(node.id);
    if (!currentNode || currentNode.computedHidden) {
      console.warn(`[ngDiagram] startLinking ignored: source node "${node.id}" is missing or effectively hidden.`);
      return;
    }

    // A previous manual linking still in flight would leave its document
    // listeners and its interaction-cleanup entry orphaned — latest call wins.
    this.removeListeners();
    this.node = node;
    this.portId = portId;
    this.linkingGestureState.active.set(true);
    const position = this.cursorPositionTrackerService.getLastPosition();

    const startEvent = {
      clientX: position.x,
      clientY: position.y,
    } as PointerInputEvent;

    this.linkingEventService.emitStart(startEvent, node, portId);

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('click', this.onDocumentClick, true);
    document.addEventListener('touchmove', this.onTouchMove, { passive: false });
    document.addEventListener('touchend', this.onTouchEnd, { passive: false });
    this.unregisterInteractionCleanup = this.flowCoreProvider
      .provide()
      .registerInteractionCleanup(() => this.removeListeners());
  }

  /**
   * Call this method to start linking from a position on the canvas (no source
   * node) from your custom logic. The edge follows the pointer until a click
   * finishes it.
   *
   * Requires `danglingEdges.enabled` — an edge drawn from a position has an
   * empty source, i.e. it is a dangling edge by construction.
   */
  startLinkingFromPosition(position: Point) {
    const flowCore = this.flowCoreProvider.provide();
    // Validate BEFORE attaching document listeners — a refused command would
    // leave the click-capture listener swallowing the next click.
    if (!flowCore.config.danglingEdges.enabled) {
      console.warn(
        '[ngDiagram] startLinkingFromPosition ignored: dangling edges are disabled. ' +
          'Set config.danglingEdges.enabled = true to draw edges from a position.'
      );
      return;
    }
    if (flowCore.actionStateManager.isLinking()) {
      console.warn(
        '[ngDiagram] startLinkingFromPosition ignored: another linking or relinking gesture is in progress.'
      );
      return;
    }

    // Defensive: a stale set of listeners (previous gesture torn down without
    // reaching removeListeners) must not double-drive the new draw.
    this.removeListeners();
    this.node = undefined;
    this.portId = undefined;
    this.linkingGestureState.active.set(true);

    flowCore.commandHandler.emit('startLinkingFromPosition', { position });

    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('click', this.onDocumentClick, true);
    document.addEventListener('touchmove', this.onTouchMove, { passive: false });
    document.addEventListener('touchend', this.onTouchEnd, { passive: false });
    this.unregisterInteractionCleanup = this.flowCoreProvider
      .provide()
      .registerInteractionCleanup(() => this.removeListeners());
  }

  private onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') {
      return;
    }
    this.linkingEventService.emitContinue(event as PointerInputEvent);
  };

  private onTouchMove = (event: TouchEvent) => {
    if (event.touches.length !== 1) {
      return;
    }

    event.preventDefault();
    const touch = event.touches[0];
    const mockEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
    } as PointerInputEvent;

    this.linkingEventService.emitContinue(mockEvent);
  };

  private onTouchEnd = (event: TouchEvent) => {
    event.preventDefault();
    const touch = event.changedTouches[0];
    const mockEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
    } as PointerInputEvent;

    this.removeListeners();
    this.linkingEventService.emitEnd(mockEvent, this.node, this.portId);
  };

  private onDocumentClick = (event: MouseEvent) => {
    this.removeListeners();
    this.linkingEventService.emitEnd(event as PointerInputEvent, this.node, this.portId);
  };

  private removeListeners() {
    this.unregisterInteractionCleanup?.();
    this.unregisterInteractionCleanup = null;
    // Unconditional: both entry points refuse via isLinking() before reaching
    // this call, so no port-drag gesture can own the signal at this point.
    this.linkingGestureState.active.set(false);
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('click', this.onDocumentClick, true);
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
  }
}
