import { CommandHandler } from '../types/command-handler.interface';

export interface MoveSelectionCommand {
  name: 'moveSelection';
  dx: number;
  dy: number;
}

export const moveSelection = (commandHandler: CommandHandler, { dx, dy }: MoveSelectionCommand): void => {
  const state = commandHandler.flowCore.getState();

  const updatedNodes = state.nodes.map((node) => {
    if (node.selected) {
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
