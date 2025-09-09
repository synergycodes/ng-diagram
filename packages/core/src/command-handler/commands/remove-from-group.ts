import type { CommandHandler, Node } from '../../types';

export interface RemoveFromGroupCommand {
  name: 'removeFromGroup';
  groupId: Node['id'];
  nodeIds: Node['id'][];
}

export const removeFromGroup = async (commandHandler: CommandHandler, { groupId, nodeIds }: RemoveFromGroupCommand) => {
  const nodes = nodeIds.map((id) => commandHandler.flowCore.modelLookup.getNodeById(id)).filter(Boolean) as Node[];
  const group = commandHandler.flowCore.modelLookup.getNodeById(groupId);

  if (!group) {
    return;
  }

  const updateData: { id: string; groupId?: string }[] = [];

  for (const node of nodes) {
    if (commandHandler.flowCore.modelLookup.wouldCreateCircularDependency(node.id, groupId)) {
      continue;
    }

    if (node.groupId !== groupId) {
      continue;
    }

    if (!commandHandler.flowCore.config.grouping.canGroup(node, group)) {
      continue;
    }

    updateData.push({
      id: node.id,
      groupId: undefined,
    });
  }

  if (updateData.length > 0) {
    await commandHandler.flowCore.commandHandler.emit('updateNodes', { nodes: updateData });
  }

  // That means a group has been highlighted, so we need to clear it
  if (updateData.some((node) => Boolean(node.groupId))) {
    commandHandler.flowCore.commandHandler.emit('highlightGroupClear');
  }
};
