import type { EventManager } from '../../../../event-manager/event-manager';
import type { GroupMembershipChangedEvent } from '../../../../event-manager/event-types';
import type { GroupNode, MiddlewareContext, Node } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class GroupMembershipChangedEmitter implements EventEmitter {
  name = 'GroupMembershipChangedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!context.modelActionTypes.includes('updateNodes')) {
      return;
    }

    if (!context.helpers.checkIfAnyNodePropsChanged(['groupId'])) {
      return;
    }

    const { initialNodesMap, nodesMap } = context;

    const affectedNodeIds = context.helpers.getAffectedNodeIds(['groupId']);

    const groupedNodesMap = new Map<string, Node[]>();
    const ungroupedNodes: Node[] = [];

    for (const nodeId of affectedNodeIds) {
      const initialNode = initialNodesMap.get(nodeId);
      const currentNode = nodesMap.get(nodeId);

      if (!initialNode || !currentNode) continue;

      const prevGroupId = initialNode.groupId;
      const currGroupId = currentNode.groupId;

      if (currGroupId != null) {
        if (!groupedNodesMap.has(currGroupId)) {
          groupedNodesMap.set(currGroupId, []);
        }
        groupedNodesMap.get(currGroupId)!.push(currentNode);
      } else if (prevGroupId != null) {
        ungroupedNodes.push(currentNode);
      }
    }

    const grouped: { nodes: Node[]; targetGroup: GroupNode }[] = [];
    for (const [targetGroupId, groupedNodes] of groupedNodesMap) {
      const targetGroup = nodesMap.get(targetGroupId) as GroupNode;
      if (targetGroup && targetGroup.isGroup) {
        grouped.push({ nodes: groupedNodes, targetGroup });
      }
    }

    if (grouped.length > 0 || ungroupedNodes.length > 0) {
      const event: GroupMembershipChangedEvent = {
        grouped,
        ungrouped: ungroupedNodes,
      };
      eventManager.deferredEmit('groupMembershipChanged', event);
    }
  }
}
