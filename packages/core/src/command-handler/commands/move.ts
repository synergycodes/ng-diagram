import type { CommandHandler, Node } from '../../types';
import { isSamePoint } from '../../utils';

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
  const nodesToUpdate: { id: Node['id']; position: Node['position'] }[] = [];
  nodes.forEach((node) => {
    const newPosition = {
      x: node.position.x + delta.x,
      y: node.position.y + delta.y,
    };
    if (isSamePoint(node.position, newPosition)) {
      return;
    }
    nodesToUpdate.push({ id: node.id, position: newPosition });
  });

  if (nodesToUpdate.length === 0) {
    return;
  }

  await commandHandler.flowCore.applyUpdate({ nodesToUpdate }, 'moveNodesBy');
};
