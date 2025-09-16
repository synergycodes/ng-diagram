import type { EventManager } from '../../../../event-manager/event-manager';
import type { EdgeDrawnEvent } from '../../../../event-manager/event-types';
import type { Edge, MiddlewareContext, Node } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class EdgeDrawnEmitter implements EventEmitter {
  name = 'EdgeDrawnEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (context.modelActionType !== 'finishLinking') {
      return;
    }

    if (!context.helpers.anyEdgesAdded()) {
      return;
    }

    const { initialEdgesMap, edgesMap, nodesMap } = context;

    this.emitNewEdges(initialEdgesMap, edgesMap, nodesMap, eventManager);
  }

  private emitNewEdges(
    initialEdgesMap: Map<string, Edge>,
    edgesMap: Map<string, Edge>,
    nodesMap: Map<string, Node>,
    eventManager: EventManager
  ): void {
    for (const [id, edge] of edgesMap) {
      if (!initialEdgesMap.has(id)) {
        const sourceNode = nodesMap.get(edge.source);
        const targetNode = nodesMap.get(edge.target);

        if (sourceNode && targetNode) {
          const event: EdgeDrawnEvent = {
            edge,
            source: sourceNode,
            target: targetNode,
            sourcePort: edge.sourcePort,
            targetPort: edge.targetPort,
          };
          eventManager.emit('edgeDrawn', event);
        }
      }
    }
  }
}
