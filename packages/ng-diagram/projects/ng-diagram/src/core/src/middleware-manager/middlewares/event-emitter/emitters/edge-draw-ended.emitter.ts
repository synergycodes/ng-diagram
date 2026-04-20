import type { EventManager } from '../../../../event-manager/event-manager';
import type { EdgeDrawEndedEvent } from '../../../../event-manager/event-types';
import type { MiddlewareContext } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class EdgeDrawEndedEmitter implements EventEmitter {
  name = 'EdgeDrawEndedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!context.modelActionTypes.includes('finishLinking')) {
      return;
    }

    const linking = context.actionStateManager.linking;
    if (!linking) {
      return;
    }

    const sourceNode = context.nodesMap.get(linking.sourceNodeId);
    if (!sourceNode) {
      return;
    }

    const dropPosition = linking.dropPosition ?? { x: 0, y: 0 };

    if (context.helpers.anyEdgesAdded()) {
      for (const [id, edge] of context.edgesMap) {
        if (!context.initialEdgesMap.has(id)) {
          const targetNode = edge.target ? context.nodesMap.get(edge.target) : undefined;
          const event: EdgeDrawEndedEvent = {
            source: sourceNode,
            sourcePort: edge.sourcePort,
            dropPosition,
            success: true,
            edge,
            target: targetNode,
            targetPort: edge.targetPort,
          };
          eventManager.deferredEmit('edgeDrawEnded', event);
          break;
        }
      }
    } else {
      const event: EdgeDrawEndedEvent = {
        source: sourceNode,
        sourcePort: linking.sourcePortId || undefined,
        dropPosition,
        success: false,
        reason: linking.cancelReason,
      };
      eventManager.deferredEmit('edgeDrawEnded', event);
    }
  }
}
