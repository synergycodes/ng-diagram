import type { EventManager } from '../../../../event-manager/event-manager';
import type { SelectionMovedEvent } from '../../../../event-manager/event-types';
import type { MiddlewareContext, Node } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class SelectionMovedEmitter implements EventEmitter {
  name = 'SelectionMovedEmitter';

  private readonly moveActions = ['moveNodes', 'moveNodesBy'];

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!this.moveActions.some((action) => context.modelActionTypes.includes(action))) {
      return;
    }

    const { initialNodesMap, nodesMap, initialUpdate, history } = context;

    const updatedNodeIds = this.collectUpdatedNodeIds(initialUpdate, history);

    if (updatedNodeIds.size === 0) {
      return;
    }

    const movedNodes = this.getMovedNodes(updatedNodeIds, initialNodesMap, nodesMap);

    if (!movedNodes || movedNodes.length === 0) {
      return;
    }

    const event: SelectionMovedEvent = {
      nodes: movedNodes,
    };
    eventManager.deferredEmit('selectionMoved', event);
  }

  private collectUpdatedNodeIds(
    initialUpdate: MiddlewareContext['initialUpdate'],
    history: MiddlewareContext['history']
  ): Set<string> {
    const nodeIds = new Set<string>();

    if (initialUpdate?.nodesToUpdate) {
      for (const node of initialUpdate.nodesToUpdate) {
        nodeIds.add(node.id);
      }
    }

    for (const update of history) {
      if (update.stateUpdate?.nodesToUpdate) {
        for (const node of update.stateUpdate.nodesToUpdate) {
          nodeIds.add(node.id);
        }
      }
    }

    return nodeIds;
  }

  private getMovedNodes(
    updatedNodeIds: Set<string>,
    initialNodesMap: Map<string, Node>,
    nodesMap: Map<string, Node>
  ): Node[] | null {
    const movedNodes: Node[] = [];

    for (const id of updatedNodeIds) {
      const node = nodesMap.get(id);
      if (!node) continue;

      const initialNode = initialNodesMap.get(id);
      if (node.position && initialNode?.position) {
        if (node.position.x !== initialNode.position.x || node.position.y !== initialNode.position.y) {
          movedNodes.push(node);
        }
      }
    }

    return movedNodes.length > 0 ? movedNodes : null;
  }
}
