import type { CommandHandler, Node } from '../../types';

export interface GroupHighlightCommand {
  name: 'groupHighlight';
  groupId: Node['id'];
}

export const groupHighlight = async (
  commandHandler: CommandHandler,
  { groupId }: GroupHighlightCommand
): Promise<void> => {
  const { highlightedGroup } = commandHandler.flowCore.getState().metadata;

  if (highlightedGroup === groupId) return;

  const nodesToUpdate = [{ id: groupId, highlighted: true }];

  if (highlightedGroup) {
    nodesToUpdate.push({ id: highlightedGroup, highlighted: false });
  }

  commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: { highlightedGroup: groupId },
      nodesToUpdate,
    },
    'groupHighlight'
  );
};

export interface GroupHighlightClearCommand {
  name: 'groupHighlightClear';
}

export const groupHighlightClear = async (commandHandler: CommandHandler): Promise<void> => {
  const { highlightedGroup } = commandHandler.flowCore.getState().metadata;

  if (!highlightedGroup) return;

  commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: { highlightedGroup: null },
      nodesToUpdate: [{ id: highlightedGroup, highlighted: false }],
    },
    'groupHighlightClear'
  );
};
