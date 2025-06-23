import type { CommandHandler } from '../../types';
import type { Node } from '../../types/node.interface';
import { snapNumber } from '../../utils/snap-number';

export interface MoveNodesByCommand {
  name: 'moveNodesBy';
  nodes: Node[];
  delta: {
    x: number;
    y: number;
  };
}

const SNAP_GRID = 10;

export const moveNodesBy = (commandHandler: CommandHandler, { delta, nodes }: MoveNodesByCommand): void => {
  if (nodes.length === 0) {
    return;
  }

  commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: nodes.map((node) => ({
        id: node.id,
        position: {
          x: snapNumber(node.position.x + delta.x, SNAP_GRID),
          y: snapNumber(node.position.y + delta.y, SNAP_GRID),
        },
      })),
    },
    'moveNodesBy'
  );
};
