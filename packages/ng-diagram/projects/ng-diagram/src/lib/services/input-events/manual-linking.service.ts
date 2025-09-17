import { inject, Injectable } from '@angular/core';
import { Node } from '@angularflow/core';
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
  startLinking(node: Node, portId: string) {
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
  }

  private onPointerMove = (event: PointerEvent) => {
    this.linkingEventService.emitContinue(event as PointerInputEvent);
  };

  private onDocumentClick = (event: MouseEvent) => {
    this.cleanup();
    this.linkingEventService.emitEnd(event as PointerInputEvent, this.node, this.portId);
  };

  private cleanup() {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('click', this.onDocumentClick, true);
  }
}
