import type { CommandHandler } from '../../types';

export interface MoveSelectionCommand {
  name: 'moveSelection';
  dx: number;
  dy: number;
}

export const moveSelection = (commandHandler: CommandHandler, { dx, dy }: MoveSelectionCommand): void => {
  const { nodes } = commandHandler.flowCore.getState();

  const nodesToMove = nodes.filter((node) => node.selected);

  if (nodesToMove.length === 0) {
    return;
  }

  commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: nodesToMove.map((node) => ({
        id: node.id,
        position: {
          x: Math.round(node.position.x + dx),
          y: Math.round(node.position.y + dy),
        },
      })),
    },
    'moveSelection'
  );
};
