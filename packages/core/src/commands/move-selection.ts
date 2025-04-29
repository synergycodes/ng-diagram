import { CommandHandler } from '../types/command-handler.interface';

export interface MoveSelectionCommand {
  name: 'moveSelection';
  dx: number;
  dy: number;
}

export const moveSelection = (commandHandler: CommandHandler, { dx, dy }: MoveSelectionCommand): void => {
  const { nodes } = commandHandler.flowCore.getState();

  const selectedNodes = nodes.filter((node) => node.selected);

  if (selectedNodes.length === 0) {
    return;
  }

  const updatedNodes = nodes.map((node) => {
    if (selectedNodes.includes(node)) {
      return {
        ...node,
        position: {
          x: node.position.x + dx,
          y: node.position.y + dy,
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
