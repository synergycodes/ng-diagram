import { NgDiagramMath } from '../../math';
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
    const snappedPosition = applySnappingIfNeeded(commandHandler, node, newPosition);

    if (isSamePoint(node.position, newPosition)) {
      return;
    }
    nodesToUpdate.push({ id: node.id, position: snappedPosition });
  });

  if (nodesToUpdate.length === 0) {
    return;
  }

  await commandHandler.flowCore.applyUpdate({ nodesToUpdate }, 'moveNodesBy');
};

const applySnappingIfNeeded = (
  commandHandler: CommandHandler,
  node: Node,
  nextPosition: Node['position']
): Node['position'] => {
  const { shouldSnapDragForNode, computeSnapForNodeDrag, defaultDragSnap } = commandHandler.flowCore.config.snapping;
  if (!shouldSnapDragForNode(node)) {
    return nextPosition;
  }

  const snap = computeSnapForNodeDrag(node) ?? defaultDragSnap;
  const snappedPosition = NgDiagramMath.snapPoint(nextPosition, snap);

  return snappedPosition;
};
