import { EventHandler } from '../event-hander';
import { LinkingInputEvent } from './linking.event';

export class LinkingEventHandler extends EventHandler<LinkingInputEvent> {
  isLinking = false;

  handle(event: LinkingInputEvent): void {
    switch (event.phase) {
      case 'start': {
        const sourceNodeId = event.target?.id;
        if (!sourceNodeId) {
          throw new Error('Linking event must have a target Node');
        }

        this.isLinking = true;
        this.flow.commandHandler.emit('startLinking', {
          source: sourceNodeId,
          sourcePort: event.portId,
        });

        break;
      }
      case 'continue': {
        if (!this.isLinking) break;

        const flowPosition = this.flow.clientToFlowPosition(event.lastInputPoint);

        this.flow.commandHandler.emit('moveTemporaryEdge', {
          position: flowPosition,
        });

        break;
      }
      case 'end': {
        if (!this.isLinking) break;

        this.isLinking = false;
        const flowPosition = this.flow.clientToFlowPosition(event.lastInputPoint);

        this.flow.commandHandler.emit('finishLinking', {
          position: flowPosition,
        });

        break;
      }
    }
  }
}
