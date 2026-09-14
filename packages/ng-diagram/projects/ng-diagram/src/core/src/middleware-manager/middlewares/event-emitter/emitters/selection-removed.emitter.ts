import type { EventManager } from '../../../../event-manager/event-manager';
import { SelectionRemovedEvent } from '../../../../event-manager/event-types';
import type { Edge, MiddlewareContext, Node } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class SelectionRemovedEmitter implements EventEmitter {
  name = 'SelectionRemovedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!context.modelActionTypes.includes('deleteSelection')) {
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
    const detachedEdges: Edge[] = [];
    for (const [id, edge] of initialEdgesMap) {
      const currentEdge = edgesMap.get(id);
      if (!currentEdge) {
        edgesToDelete.push(edge);
      } else if (currentEdge.source !== edge.source || currentEdge.target !== edge.target) {
        // An endpoint changed within the delete pass — the edge was demoted to
        // dangling by detach-on-node-delete rather than deleted.
        detachedEdges.push(currentEdge);
      }
    }

    if (nodesToDelete.length > 0 || edgesToDelete.length > 0 || detachedEdges.length > 0) {
      const event: SelectionRemovedEvent = {
        deletedNodes: nodesToDelete,
        deletedEdges: edgesToDelete,
        detachedEdges,
      };
      eventManager.deferredEmit('selectionRemoved', event);
    }
  }
}
