import type { InternalLinkingActionState } from '../../../types/action-state.interface';
import { EventHandler } from '../event-handler';
import { RelinkingInputEvent } from './relinking.event';

/** @internal */
export const RELINKING_MISSING_TARGET_ERROR = (event: RelinkingInputEvent) =>
  `[ngDiagram] Relinking event missing target edge.

Event details:
  • Phase: ${event.phase}
  • End: ${event.end}
  • Target type: ${event.targetType}
  • Pointer position: (${event.lastInputPoint.x}, ${event.lastInputPoint.y})

This indicates a programming error. Relinking start events must have a target edge.
`;

export class RelinkingEventHandler extends EventHandler<RelinkingInputEvent> {
  handle(event: RelinkingInputEvent): void {
    if (this.flow.isCancellingInteraction()) {
      return;
    }

    const relink = () => (this.flow.actionStateManager.linking as InternalLinkingActionState | undefined)?.relink;

    switch (event.phase) {
      case 'start': {
        const edgeId = event.target?.id;
        if (!edgeId) {
          throw new Error(RELINKING_MISSING_TARGET_ERROR(event));
        }

        this.flow.commandHandler.emit('startRelinking', {
          edgeId,
          end: event.end,
        });

        break;
      }
      case 'continue': {
        if (!relink()) break;

        const flowPosition = this.flow.clientToFlowPosition(event.lastInputPoint);

        if (this.flow.config.viewportPanningEnabled && event.panningForce) {
          this.flow.commandHandler.emit('moveViewportBy', { x: event.panningForce.x, y: event.panningForce.y });
        }

        this.flow.commandHandler.emit('moveTemporaryEdge', {
          position: flowPosition,
        });

        break;
      }
      case 'end': {
        if (!relink()) break;

        // A taken-over end carries another pointer's coordinates — abort the
        // relink instead of hit-testing them as the drop target.
        if (event.takenOver) {
          this.flow.commandHandler.emit('cancelLinking');
          break;
        }

        const flowPosition = this.flow.clientToFlowPosition(event.lastInputPoint);

        this.flow.commandHandler.emit('finishRelinking', { position: flowPosition });

        break;
      }
    }
  }

  // No cancel() override: the interaction coordinator's `linking` entry covers
  // relinks too — `isLinking()` is true during a relink and `cancelLinking`
  // branches on `linking.relink`, so Escape reaches the right teardown through
  // the LinkingEventHandler.
}
