import { EventHandler } from '../event-handler';
import { LinkingInputEvent } from './linking.event';

/** @internal */
export const LINKING_MISSING_TARGET_ERROR = (event: LinkingInputEvent) =>
  `[ngDiagram] Linking event missing target node.

Event details:
  • Phase: ${event.phase}
  • Port ID: ${event.portId}
  • Target type: ${event.targetType}
  • Pointer position: (${event.lastInputPoint.x}, ${event.lastInputPoint.y})

This indicates a programming error. Linking start events must have a target node.

Documentation: https://www.ngdiagram.dev/docs/guides/edges/edges/
`;

export class LinkingEventHandler extends EventHandler<LinkingInputEvent> {
  handle(event: LinkingInputEvent): void {
    switch (event.phase) {
      case 'start': {
        const sourceNodeId = event.target?.id;
        if (!sourceNodeId) {
          throw new Error(LINKING_MISSING_TARGET_ERROR(event));
        }

        this.flow.actionStateManager.linking = {
          sourceNodeId,
          sourcePortId: event.portId,
          temporaryEdge: null,
        };

        this.flow.commandHandler.emit('startLinking', {
          source: sourceNodeId,
          sourcePort: event.portId,
        });

        break;
      }
      case 'continue': {
        if (!this.flow.actionStateManager.isLinking()) break;

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
        if (!this.flow.actionStateManager.isLinking()) break;

        const flowPosition = this.flow.clientToFlowPosition(event.lastInputPoint);

        this.flow.commandHandler.emit('finishLinking', { position: flowPosition });
        this.flow.actionStateManager.clearLinking();

        break;
      }
    }
  }
}
