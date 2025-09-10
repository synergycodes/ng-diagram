import type { CommandHandler, GroupNode, Node } from '../../types';

export interface RemoveFromGroupCommand {
  name: 'removeFromGroup';
  groupId: GroupNode['id'];
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
    if (node.groupId !== groupId) {
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
};
