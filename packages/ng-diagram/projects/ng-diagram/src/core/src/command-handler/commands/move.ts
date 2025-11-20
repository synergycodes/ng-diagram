import { NgDiagramMath } from '../../math';
import type { CommandHandler, Node, Point } from '../../types';
import { isSamePoint } from '../../utils';

export interface MoveNodesByCommand {
  name: 'moveNodesBy';
  nodes: Node[];
  delta: Point;
}

export const moveNodesBy = async (
  commandHandler: CommandHandler,
  { delta, nodes }: MoveNodesByCommand
): Promise<void> => {
  const nodeIdsBeingMoved = new Set(nodes.map((node) => node.id));
  const rootNodes = nodes.filter((node) => !node.groupId || !nodeIdsBeingMoved.has(node.groupId));

  const nodesToUpdate = processRootNodesWithDescendants(commandHandler, rootNodes, nodeIdsBeingMoved, delta);

  if (nodesToUpdate.length === 0) {
    return;
  }

  await commandHandler.flowCore.applyUpdate({ nodesToUpdate }, 'moveNodesBy');
};

const processRootNodesWithDescendants = (
  commandHandler: CommandHandler,
  rootNodes: Node[],
  nodeIdsBeingMoved: Set<string>,
  delta: Point
): { id: string; position: Point }[] => {
  const nodesToUpdate: { id: string; position: Point }[] = [];
  const processedNodeIds = new Set<string>();

  rootNodes.forEach((rootNode) => {
    const { snappedPosition, actualDelta } = calculateRootNodeMovement(commandHandler, rootNode, delta);

    if (!isSamePoint(rootNode.position, snappedPosition)) {
      nodesToUpdate.push({ id: rootNode.id, position: snappedPosition });
    }
    processedNodeIds.add(rootNode.id);

    applyDeltaToDescendants(
      commandHandler,
      rootNode.id,
      actualDelta,
      nodeIdsBeingMoved,
      processedNodeIds,
      nodesToUpdate
    );
  });

  return nodesToUpdate;
};

const calculateRootNodeMovement = (
  commandHandler: CommandHandler,
  node: Node,
  delta: Point
): { snappedPosition: Point; actualDelta: Point } => {
  const newPosition = {
    x: node.position.x + delta.x,
    y: node.position.y + delta.y,
  };
  const snappedPosition = applySnappingIfNeeded(commandHandler, node, newPosition);
  const actualDelta = {
    x: snappedPosition.x - node.position.x,
    y: snappedPosition.y - node.position.y,
  };

  return { snappedPosition, actualDelta };
};

const applyDeltaToDescendants = (
  commandHandler: CommandHandler,
  rootNodeId: string,
  actualDelta: Point,
  nodeIdsBeingMoved: Set<string>,
  processedNodeIds: Set<string>,
  nodesToUpdate: { id: string; position: Point }[]
): void => {
  const descendants = commandHandler.flowCore.modelLookup.getAllDescendants(rootNodeId);

  descendants.forEach((descendant) => {
    if (nodeIdsBeingMoved.has(descendant.id) && !processedNodeIds.has(descendant.id)) {
      const newPosition = {
        x: descendant.position.x + actualDelta.x,
        y: descendant.position.y + actualDelta.y,
      };

      if (!isSamePoint(descendant.position, newPosition)) {
        nodesToUpdate.push({ id: descendant.id, position: newPosition });
      }
      processedNodeIds.add(descendant.id);
    }
  });
};

const applySnappingIfNeeded = (commandHandler: CommandHandler, node: Node, nextPosition: Point): Point => {
  const { shouldSnapDragForNode, computeSnapForNodeDrag, defaultDragSnap } = commandHandler.flowCore.config.snapping;
  if (!shouldSnapDragForNode(node)) {
    return nextPosition;
  }

  const snap = computeSnapForNodeDrag(node) ?? defaultDragSnap;
  const snappedPosition = NgDiagramMath.snapPoint(nextPosition, snap);

  return snappedPosition;
};
