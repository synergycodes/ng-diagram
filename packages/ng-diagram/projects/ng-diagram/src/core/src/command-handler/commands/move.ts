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

  const accumulatedDeltas = commandHandler.flowCore.actionStateManager?.dragging?.accumulatedDeltas;
  const nodesToUpdate = processRootNodesWithDescendants(
    commandHandler,
    rootNodes,
    nodeIdsBeingMoved,
    delta,
    accumulatedDeltas
  );

  if (nodesToUpdate.length === 0) {
    return;
  }

  await commandHandler.flowCore.applyUpdate({ nodesToUpdate }, 'moveNodesBy');
};

const processRootNodesWithDescendants = (
  commandHandler: CommandHandler,
  rootNodes: Node[],
  nodeIdsBeingMoved: Set<string>,
  delta: Point,
  accumulatedDeltas: Map<string, Point> | undefined
): { id: string; position: Point }[] => {
  const nodesToUpdate: { id: string; position: Point }[] = [];
  const processedNodeIds = new Set<string>();

  rootNodes.forEach((rootNode) => {
    const { snappedPosition, actualDelta } = calculateRootNodeMovement(
      commandHandler,
      rootNode,
      delta,
      accumulatedDeltas
    );

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
  delta: Point,
  accumulatedDeltas: Map<string, Point> | undefined
): { snappedPosition: Point; actualDelta: Point } => {
  const { snappedPosition, newAccumulated } = applySnappingWithAccumulation(
    commandHandler,
    node,
    delta,
    accumulatedDeltas
  );

  if (accumulatedDeltas) {
    accumulatedDeltas.set(node.id, newAccumulated);
  }

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

const applySnappingWithAccumulation = (
  commandHandler: CommandHandler,
  node: Node,
  delta: Point,
  accumulatedDeltas: Map<string, Point> | undefined
): { snappedPosition: Point; newAccumulated: Point } => {
  const { shouldSnapDragForNode, computeSnapForNodeDrag, defaultDragSnap } = commandHandler.flowCore.config.snapping;

  const accumulated = accumulatedDeltas?.get(node.id) ?? { x: 0, y: 0 };
  const totalDelta = {
    x: accumulated.x + delta.x,
    y: accumulated.y + delta.y,
  };

  if (!shouldSnapDragForNode(node)) {
    return {
      snappedPosition: {
        x: node.position.x + totalDelta.x,
        y: node.position.y + totalDelta.y,
      },
      newAccumulated: { x: 0, y: 0 },
    };
  }

  const snap = computeSnapForNodeDrag(node) ?? defaultDragSnap;
  const targetPosition = {
    x: node.position.x + totalDelta.x,
    y: node.position.y + totalDelta.y,
  };
  const snappedPosition = NgDiagramMath.snapPoint(targetPosition, snap);

  const actualMovement = {
    x: snappedPosition.x - node.position.x,
    y: snappedPosition.y - node.position.y,
  };
  const newAccumulated = {
    x: totalDelta.x - actualMovement.x,
    y: totalDelta.y - actualMovement.y,
  };

  return { snappedPosition, newAccumulated };
};
