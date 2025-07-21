import { Port } from '../../../types/node.interface';
import { __NEW__EventHandler } from '../event-hander';
import { LinkingInputEvent } from './linking.event';

export class LinkingEventHandler extends __NEW__EventHandler<LinkingInputEvent> {
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
        const nearestPort = this.flow.getNearestPortInRange(flowPosition, 10);

        const { temporaryEdge } = this.flow.getState().metadata;

        if (nearestPort && this.isProperTargetPort(nearestPort, temporaryEdge?.source, temporaryEdge?.sourcePort)) {
          this.flow.commandHandler.emit('moveTemporaryEdge', {
            position: flowPosition,
            target: nearestPort.nodeId,
            targetPort: nearestPort.id,
          });
        } else {
          this.flow.commandHandler.emit('moveTemporaryEdge', {
            position: flowPosition,
            target: '',
            targetPort: '',
          });
        }

        break;
      }
      case 'end': {
        if (!this.isLinking) break;

        this.isLinking = false;
        const temporaryEdge = this.flow.getState().metadata.temporaryEdge;
        this.flow.commandHandler.emit('finishLinking', {
          target: temporaryEdge?.target,
          targetPort: temporaryEdge?.targetPort,
        });

        break;
      }
    }
  }

  private isProperTargetPort(targetPort: Port, source?: string, sourcePortId?: string) {
    if (targetPort.type === 'source') {
      return false;
    }
    if (source && targetPort.nodeId !== source) {
      return true;
    }
    if (sourcePortId && targetPort.id !== sourcePortId) {
      return true;
    }
    return false;
  }
}
