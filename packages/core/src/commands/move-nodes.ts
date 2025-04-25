import { CommandHandler } from '../types/command-handler.interface';

export interface MoveNodesCommand {
  name: 'moveNodes';
  dx: number;
  dy: number;
}

export const moveNodes = (commandHandler: CommandHandler, { dx, dy }: MoveNodesCommand): void => {
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
    'moveNodes'
  );
};
