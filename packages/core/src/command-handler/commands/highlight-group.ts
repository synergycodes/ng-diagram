import type { CommandHandler, Node } from '../../types';

let highlightedGroupId: string | null = null;

export interface HighlightGroupCommand {
  name: 'highlightGroup';
  groupId: Node['id'];
  nodes: Node[];
}

export const highlightGroup = async (commandHandler: CommandHandler, { groupId, nodes }: HighlightGroupCommand) => {
  if (highlightedGroupId === groupId) {
    return;
  }

  const group = commandHandler.flowCore.modelLookup.getNodeById(groupId);

  if (!group) {
    return;
  }

  if (!nodes.some((node) => commandHandler.flowCore.config.grouping.canGroup(node, group))) {
    return;
  }

  const nodesToUpdate = [{ id: groupId, highlighted: true }];

  if (highlightedGroupId) {
    nodesToUpdate.push({ id: highlightedGroupId, highlighted: false });
  }

  highlightedGroupId = groupId;

  await commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate,
    },
    'highlightGroup'
  );
};

export interface HighlightGroupClearCommand {
  name: 'highlightGroupClear';
}

export const highlightGroupClear = async (commandHandler: CommandHandler) => {
  if (!highlightedGroupId) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: [{ id: highlightedGroupId, highlighted: false }],
    },
    'highlightGroupClear'
  );

  highlightedGroupId = null;
};
