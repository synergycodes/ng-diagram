import type { EventManager } from '../../../../event-manager/event-manager';
import { SelectionRemovedEvent } from '../../../../event-manager/event-types';
import type { Edge, MiddlewareContext, Node } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class SelectionRemovedEmitter implements EventEmitter {
  name = 'SelectionRemovedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (context.modelActionType !== 'deleteSelection') {
      return;
    }

    const { initialNodesMap, initialEdgesMap, nodesMap, edgesMap } = context;

    const nodesToDelete: Node[] = [];
    for (const [id, node] of initialNodesMap) {
      if (!nodesMap.has(id)) {
        nodesToDelete.push(node);
      }
    }

    const edgesToDelete: Edge[] = [];
    for (const [id, edge] of initialEdgesMap) {
      if (!edgesMap.has(id)) {
        edgesToDelete.push(edge);
      }
    }

    if (nodesToDelete.length > 0 || edgesToDelete.length > 0) {
      const event: SelectionRemovedEvent = {
        deletedNodes: nodesToDelete,
        deletedEdges: edgesToDelete,
      };
      eventManager.deferredEmit('selectionRemoved', event);
    }
  }
}
