import type { CommandHandler, Node } from '../../types';

export interface AddToGroupCommand {
  name: 'addToGroup';
  groupId: Node['id'];
  nodeIds: Node['id'][];
}

export const addToGroup = async (commandHandler: CommandHandler, { groupId, nodeIds }: AddToGroupCommand) => {
  const highlightAtEntry = commandHandler.flowCore.actionStateManager.highlightGroup;
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

    if (node.groupId === groupId) {
      continue;
    }

    if (!commandHandler.flowCore.config.grouping.canGroup(node, group)) {
      continue;
    }

    updateData.push({
      id: node.id,
      groupId,
    });
  }

  if (updateData.length > 0) {
    await commandHandler.flowCore.commandHandler.emit('updateNodes', { nodes: updateData });
  }

  // Grouping happened, so the highlight this drop consumed gets cleared — but
  // only if it is still the one from OUR entry: a newer gesture may have
  // highlighted its own drop target while the update above was suspended.
  if (
    updateData.some((node) => Boolean(node.groupId)) &&
    commandHandler.flowCore.actionStateManager.highlightGroup === highlightAtEntry
  ) {
    await commandHandler.flowCore.commandHandler.emit('highlightGroupClear');
  }
};
