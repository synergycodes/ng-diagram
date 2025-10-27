import type { EventManager } from '../../../../event-manager/event-manager';
import type { SelectionGroupChangedEvent } from '../../../../event-manager/event-types';
import type { GroupNode, MiddlewareContext, Node } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class SelectionGroupChangedEmitter implements EventEmitter {
  name = 'SelectionGroupChangedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    // Check for both addToGroup and removeFromGroup commands
    if (context.modelActionType !== 'updateNodes') {
      return;
    }

    const { initialNodesMap, nodesMap } = context;
    const nodesToUpdate = context.initialUpdate.nodesToUpdate;

    if (!nodesToUpdate || nodesToUpdate.length === 0) {
      return;
    }

    // Find the groupId from the update (nodes being added to a group)
    const groupUpdate = nodesToUpdate.find((update) => 'groupId' in update);
    if (!groupUpdate || !('groupId' in groupUpdate)) {
      return;
    }

    const targetGroupId = groupUpdate.groupId;
    const groupedNodes: Node[] = [];
    const ungroupedNodes: Node[] = [];
    // Check all updated nodes for groupId changes
    for (const nodeUpdate of nodesToUpdate) {
      if (!('groupId' in nodeUpdate)) {
        continue;
      }

      const nodeId = nodeUpdate.id;
      const currentNode = nodesMap.get(nodeId);
      const initialNode = initialNodesMap.get(nodeId);

      if (!currentNode || !initialNode) {
        continue;
      }

      // Node was added to a group
      if (
        currentNode.groupId !== undefined &&
        currentNode.groupId === targetGroupId &&
        initialNode.groupId !== targetGroupId
      ) {
        groupedNodes.push(currentNode);
      }
      // Node was removed from a group (groupId became null/undefined)
      else if (!currentNode.groupId && initialNode.groupId) {
        ungroupedNodes.push(currentNode);
      }
    }

    // Emit event for nodes being added to a group
    if (groupedNodes.length > 0 && targetGroupId) {
      const targetGroup = nodesMap.get(targetGroupId) as GroupNode;
      if (targetGroup && targetGroup.isGroup) {
        const event: SelectionGroupChangedEvent = {
          nodes: groupedNodes,
          targetGroup,
        };
        eventManager.deferredEmit('selectionGroupChanged', event);
      }
    }
    // Emit event for nodes being ungrouped
    else if (ungroupedNodes.length > 0) {
      const event: SelectionGroupChangedEvent = {
        nodes: ungroupedNodes,
        targetGroup: undefined,
      };
      eventManager.deferredEmit('selectionGroupChanged', event);
    }
  }
}
