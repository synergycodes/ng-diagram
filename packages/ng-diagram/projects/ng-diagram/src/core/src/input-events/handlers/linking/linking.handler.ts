import { EventHandler } from '../event-handler';
import { LinkingInputEvent } from './linking.event';

export class LinkingEventHandler extends EventHandler<LinkingInputEvent> {
  handle(event: LinkingInputEvent): void {
    switch (event.phase) {
      case 'start': {
        const sourceNodeId = event.target?.id;
        if (!sourceNodeId) {
          throw new Error('Linking event must have a target Node');
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

        if (event.panningForce) {
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
