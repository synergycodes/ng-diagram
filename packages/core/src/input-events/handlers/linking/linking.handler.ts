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

        this.flow.actionStateManager.setLinkingState({
          sourceNodeId,
          sourcePortId: event.portId,
        });

        this.flow.commandHandler.emit('startLinking', {
          source: sourceNodeId,
          sourcePort: event.portId,
        });

        break;
      }
      case 'continue': {
        const linkingState = this.flow.actionStateManager.getLinkingState();
        if (!linkingState) break;

        const flowPosition = this.flow.clientToFlowPosition(event.lastInputPoint);

        this.flow.commandHandler.emit('moveTemporaryEdge', {
          position: flowPosition,
        });

        break;
      }
      case 'end': {
        const linkingState = this.flow.actionStateManager.getLinkingState();
        if (!linkingState) break;

        this.flow.actionStateManager.clearLinkingState();
        const flowPosition = this.flow.clientToFlowPosition(event.lastInputPoint);

        this.flow.commandHandler.emit('finishLinking', {
          position: flowPosition,
        });

        break;
      }
    }
  }
}
