import type { CommandHandler } from '../../types';

export interface MoveSelectionCommand {
  name: 'moveSelection';
  dx: number;
  dy: number;
}

export const moveSelection = (commandHandler: CommandHandler, { dx, dy }: MoveSelectionCommand): void => {
  const { nodes } = commandHandler.flowCore.getState();

  const selectedNodesIds = nodes.filter((node) => node.selected).map((node) => node.id);

  if (selectedNodesIds.length === 0) {
    return;
  }

  const updatedNodes = nodes.map((node) => {
    if (selectedNodesIds.includes(node.id)) {
      return {
        ...node,
        position: {
          x: Math.round(node.position.x + dx),
          y: Math.round(node.position.y + dy),
        },
      };
    }
    return node;
  });

  commandHandler.flowCore.applyUpdate(
    {
      nodes: updatedNodes,
    },
    'moveSelection'
  );
};
