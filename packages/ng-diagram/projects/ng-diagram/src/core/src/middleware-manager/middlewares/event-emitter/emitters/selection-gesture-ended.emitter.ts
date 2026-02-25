import type { EventManager } from '../../../../event-manager/event-manager';
import type { Edge, MiddlewareContext, Node } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class SelectionGestureEndedEmitter implements EventEmitter {
  name = 'SelectionGestureEndedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!context.modelActionTypes.includes('selectEnd')) {
      return;
    }

    if (!context.actionStateManager.selection?.selectionChanged) {
      return;
    }

    context.actionStateManager.clearSelection();

    const selectedNodes: Node[] = [];
    for (const node of context.nodesMap.values()) {
      if (node.selected) {
        selectedNodes.push(node);
      }
    }

    const selectedEdges: Edge[] = [];
    for (const edge of context.edgesMap.values()) {
      if (edge.selected) {
        selectedEdges.push(edge);
      }
    }

    eventManager.deferredEmit('selectionGestureEnded', {
      nodes: selectedNodes,
      edges: selectedEdges,
    });
  }
}
