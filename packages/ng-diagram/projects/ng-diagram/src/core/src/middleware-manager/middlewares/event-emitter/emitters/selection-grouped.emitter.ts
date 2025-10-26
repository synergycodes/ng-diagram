import type { EventManager } from '../../../../event-manager/event-manager';
import type { SelectionGroupedEvent } from '../../../../event-manager/event-types';
import type { GroupNode, MiddlewareContext, Node } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class SelectionGroupedEmitter implements EventEmitter {
  name = 'SelectionGroupedEmitter';

  // TODO - CONSIDER IF UNGROUP SHOULD ALSO BE HANDLED HERE

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (context.modelActionType !== 'updateNodes') {
      return;
    }

    const { initialNodesMap, nodesMap } = context;
    const groupId = context.initialUpdate.nodesToUpdate?.find((update) => 'groupId' in update)?.groupId;
    const groupedNodes: Node[] = [];
    let targetGroup: GroupNode | null = null;

    // Find nodes that got a new groupId assigned
    for (const [nodeId, currentNode] of nodesMap) {
      const initialNode = initialNodesMap.get(nodeId);

      if (initialNode && currentNode.groupId !== initialNode.groupId) {
        // Node's groupId changed
        if (currentNode.groupId && !initialNode.groupId) {
          // Node was assigned to a group (not moved between groups)
          groupedNodes.push(currentNode);
        }
      }
    }

    // Find the target group node
    if (groupId) {
      targetGroup = (nodesMap.get(groupId) as GroupNode) || null;
    }

    // Only emit if we have grouped nodes and a valid target group that is actually a group
    if (groupedNodes.length > 0 && targetGroup && targetGroup.isGroup) {
      const event: SelectionGroupedEvent = {
        groupedNodes,
        targetGroup,
      };
      eventManager.deferredEmit('selectionGrouped', event);
    }
  }
}
