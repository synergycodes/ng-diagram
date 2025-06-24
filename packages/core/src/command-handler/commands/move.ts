import type { CommandHandler } from '../../types';
import type { Node } from '../../types/node.interface';

export interface MoveNodesByCommand {
  name: 'moveNodesBy';
  nodes: Node[];
  delta: {
    x: number;
    y: number;
  };
}

export const moveNodesBy = (commandHandler: CommandHandler, { delta, nodes }: MoveNodesByCommand): void => {
  if (nodes.length === 0) {
    return;
  }

  commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: nodes.map((node) => ({
        id: node.id,
        position: {
          x: node.position.x + delta.x,
          y: node.position.y + delta.y,
        },
      })),
    },
    'moveNodesBy'
  );
};
