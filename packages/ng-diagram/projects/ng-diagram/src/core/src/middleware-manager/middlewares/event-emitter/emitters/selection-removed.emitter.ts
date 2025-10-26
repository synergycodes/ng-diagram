import type { EventManager } from '../../../../event-manager/event-manager';
import { SelectionRemovedEvent } from '../../../../event-manager/event-types';
import type { Edge, MiddlewareContext, Node } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class SelectionRemovedEmitter implements EventEmitter {
  name = 'SelectionRemovedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    // // Only emit when nodes or edges are actually removed from the diagram
    if (context.modelActionType !== 'deleteSelection') {
      return;
    }
    const {
      initialNodesMap,
      initialEdgesMap,
      initialUpdate: { nodesToRemove, edgesToRemove },
    } = context;

    const edgesToDelete: Edge[] = this.findDeletedEdges(initialEdgesMap, edgesToRemove || []);
    const nodesToDelete: Node[] = this.findDeletedNodes(initialNodesMap, nodesToRemove || []);

    if (nodesToDelete.length > 0 || edgesToDelete.length > 0) {
      const event: SelectionRemovedEvent = {
        deletedNodes: nodesToDelete,
        deletedEdges: edgesToDelete,
      };
      eventManager.deferredEmit('selectionRemoved', event);
    }
  }

  private findDeletedNodes(initialNodesMap: Map<string, Node>, deletedNodesIds: string[]): Node[] {
    const deletedNodes: Node[] = [];

    for (const nodeId of deletedNodesIds) {
      const node = initialNodesMap.get(nodeId);
      if (node) {
        deletedNodes.push(node);
      }
    }

    return deletedNodes;
  }

  private findDeletedEdges(initialEdgesMap: Map<string, Edge>, deletedEdgesIds: string[]): Edge[] {
    const deletedEdges: Edge[] = [];

    for (const edgeId of deletedEdgesIds) {
      const edge = initialEdgesMap.get(edgeId);
      if (edge) {
        deletedEdges.push(edge);
      }
    }

    return deletedEdges;
  }
}
