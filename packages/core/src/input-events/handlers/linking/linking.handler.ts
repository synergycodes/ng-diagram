import { EventHandler } from '../event-hander';
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
          temporaryEdge: null,
          sourceNodeId,
          sourcePortId: event.portId,
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

        this.flow.commandHandler.emit('moveTemporaryEdge', {
          position: flowPosition,
        });

        break;
      }
      case 'end': {
        if (!this.flow.actionStateManager.isLinking()) break;

        const temporaryEdge = this.flow.actionStateManager.linking?.temporaryEdge;

        if (temporaryEdge?.target) {
          this.flow.commandHandler.emit('finishLinking');
        } else {
          const flowPosition = this.flow.clientToFlowPosition(event.lastInputPoint);
          this.flow.commandHandler.emit('finishLinkingToPosition', {
            position: flowPosition,
          });
        }

        this.flow.actionStateManager.clearLinking();

        break;
      }
    }
  }
}
