import { inject, Injectable } from '@angular/core';
import { Node } from '../../../core/src';
import { PointerInputEvent } from '../../types';
import { CursorPositionTrackerService } from '../cursor-position-tracker/cursor-position-tracker.service';
import { LinkingEventService } from './linking-event.service';

@Injectable()
export class ManualLinkingService {
  private readonly linkingEventService = inject(LinkingEventService);
  private readonly cursorPositionTrackerService = inject(CursorPositionTrackerService);
  private node: Node | undefined;
  private portId: string | undefined;

  /** Call this method to start linking from your custom logic */
  startLinking(node: Node, portId?: string) {
    this.node = node;
    this.portId = portId;
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

    this.cleanup();
    this.linkingEventService.emitEnd(mockEvent, this.node, this.portId);
  };

  private onDocumentClick = (event: MouseEvent) => {
    this.cleanup();
    this.linkingEventService.emitEnd(event as PointerInputEvent, this.node, this.portId);
  };

  private cleanup() {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('click', this.onDocumentClick, true);
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
  }
}
