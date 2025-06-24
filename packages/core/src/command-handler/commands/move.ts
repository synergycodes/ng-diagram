import type { CommandHandler } from '../../types';
import type { Node } from '../../types/node.interface';
import { isSamePoint } from '../../utils/rects-points-sizes';

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

  const nodesToUpdate: { id: Node['id']; position: Node['position'] }[] = [];
  nodes.forEach((node) => {
    const newPosition = {
      x: Math.round(node.position.x + delta.x),
      y: Math.round(node.position.y + delta.y),
    };
    if (isSamePoint(node.position, newPosition)) {
      return;
    }
    nodesToUpdate.push({ id: node.id, position: newPosition });
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
