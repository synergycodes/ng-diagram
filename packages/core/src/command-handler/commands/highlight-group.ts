import type { CommandHandler, Node } from '../../types';

export interface HighlightGroupCommand {
  name: 'highlightGroup';
  groupId: Node['id'];
  nodes: Node[];
}

export const highlightGroup = async (commandHandler: CommandHandler, { groupId, nodes }: HighlightGroupCommand) => {
  const highlightGroupState = commandHandler.flowCore.actionStateManager.highlightGroup;
  const currentHighlightedGroupId = highlightGroupState?.highlightedGroupId;

  if (currentHighlightedGroupId === groupId) {
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

  if (currentHighlightedGroupId) {
    nodesToUpdate.push({ id: currentHighlightedGroupId, highlighted: false });
  }

  commandHandler.flowCore.actionStateManager.highlightGroup = {
    highlightedGroupId: groupId,
  };

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
  const highlightGroupState = commandHandler.flowCore.actionStateManager.highlightGroup;
  const currentHighlightedGroupId = highlightGroupState?.highlightedGroupId;

  if (!currentHighlightedGroupId) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: [{ id: currentHighlightedGroupId, highlighted: false }],
    },
    'highlightGroupClear'
  );

  commandHandler.flowCore.actionStateManager.clearHighlightGroup();
};
