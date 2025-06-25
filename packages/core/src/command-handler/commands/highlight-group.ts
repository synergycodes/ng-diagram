import type { CommandHandler, Node } from '../../types';

export interface HighlightGroupCommand {
  name: 'highlightGroup';
  groupId: Node['id'];
}

export const highlightGroup = async (commandHandler: CommandHandler, { groupId }: HighlightGroupCommand) => {
  const { highlightedGroup } = commandHandler.flowCore.getState().metadata;

  if (highlightedGroup === groupId) return;

  const nodesToUpdate = [{ id: groupId, highlighted: true }];

  if (highlightedGroup) {
    nodesToUpdate.push({ id: highlightedGroup, highlighted: false });
  }

  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: { highlightedGroup: groupId },
      nodesToUpdate,
    },
    'highlightGroup'
  );
};

export interface HighlightGroupClearCommand {
  name: 'highlightGroupClear';
}

export const highlightGroupClear = async (commandHandler: CommandHandler) => {
  const { highlightedGroup } = commandHandler.flowCore.getState().metadata;

  if (!highlightedGroup) return;

  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: { highlightedGroup: null },
      nodesToUpdate: [{ id: highlightedGroup, highlighted: false }],
    },
    'highlightGroupClear'
  );
};
