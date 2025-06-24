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

export const moveNodesBy = async (
  commandHandler: CommandHandler,
  { delta, nodes }: MoveNodesByCommand
): Promise<void> => {
  if (nodes.length === 0) {
    return;
  }

  const nodesToUpdate: Node[] = [];
  nodes.forEach((node) => {
    const newPosition = {
      x: snapNumber(node.position.x + delta.x, SNAP_GRID),
      y: snapNumber(node.position.y + delta.y, SNAP_GRID),
    };
    if (isSamePoint(node.position, newPosition)) {
      return;
    }
    nodesToUpdate.push({ ...node, position: newPosition });
  });

  if (nodesToUpdate.length === 0) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
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
