import { NgDiagramMath } from '../../math';
import type { CommandHandler, Edge, FlowConfig, FlowStateUpdate, Node, Point } from '../../types';
import { snapNodePosition } from '../../utils';
import { computeHiddenNodeIds, isEdgeEffectivelyHidden } from '../../visibility/effective-visibility';

const OFFSET = 20;

export interface CopyCommand {
  name: 'copy';
}

export interface PasteCommand {
  name: 'paste';
  position?: Point;
}

/**
 * Calculate the center point of a collection of points
 */
const calculateCenter = (points: Point[]): Point => {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  const centerX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const centerY = points.reduce((sum, point) => sum + point.y, 0) / points.length;

  return { x: centerX, y: centerY };
};

/**
 * Collect the positions anchoring the copied edges' free endpoints — the
 * endpoints that will be pasted dangling because their node was not copied
 * (or was dangling already). These anchor the pasted content at the cursor
 * exactly like node positions do.
 */
const collectFreeEdgeEndpointPositions = (copiedEdges: Edge[], copiedNodeIds: Set<string>): Point[] => {
  const positions: Point[] = [];

  for (const edge of copiedEdges) {
    if (!edge.source || !copiedNodeIds.has(edge.source)) {
      const position = edge.sourcePosition ?? edge.points?.at(0);
      if (position) {
        positions.push(position);
      }
    }
    if (!edge.target || !copiedNodeIds.has(edge.target)) {
      const position = edge.targetPosition ?? edge.points?.at(-1);
      if (position) {
        positions.push(position);
      }
    }
  }

  return positions;
};

/**
 * Calculate the paste position and offset based on command parameters
 */
const calculatePasteOffset = (copiedNodes: Node[], freeEndpointPositions: Point[], command: PasteCommand): Point => {
  if (!command.position) {
    // Default behavior: offset from original center
    return {
      x: OFFSET,
      y: OFFSET,
    };
  }

  if (copiedNodes.length === 1 && freeEndpointPositions.length === 0) {
    // Single node: center the node at cursor position, accounting for node size
    const singleNode = copiedNodes[0];
    const nodeWidth = singleNode.size?.width ?? 0;
    const nodeHeight = singleNode.size?.height ?? 0;

    // Calculate position so that cursor is at the center of the node
    const target = {
      x: command.position.x - nodeWidth / 2,
      y: command.position.y - nodeHeight / 2,
    };

    return NgDiagramMath.subtractPoints(target, singleNode.position);
  }

  // Maintain relative positioning with the center of the pasted content —
  // node positions and free edge endpoints alike — at the cursor
  const center = calculateCenter([...copiedNodes.map((node) => node.position), ...freeEndpointPositions]);
  return NgDiagramMath.subtractPoints(command.position, center);
};

/**
 * Update port nodeId references for a node
 */
const updatePortNodeIds = (node: Node): Node => {
  if (!node.measuredPorts || node.measuredPorts.length === 0) {
    return node;
  }

  const updatedPorts = node.measuredPorts.map((port) => ({
    ...port,
    nodeId: node.id, // Update nodeId reference only
  }));

  return {
    ...node,
    measuredPorts: updatedPorts,
  };
};

/**
 * Create new nodes with updated positions and IDs
 */
const createPastedNodes = (
  config: FlowConfig,
  copiedNodes: Node[],
  offset: Point,
  nodeIdMap: Map<string, string>,
  hiddenCopiedNodeIds: Set<string>
): Node[] => {
  copiedNodes.forEach((node) => {
    const newNodeId = config.computeNodeId();
    nodeIdMap.set(node.id, newNodeId);
  });

  return copiedNodes.map((node) => {
    const newNodeId = nodeIdMap.get(node.id)!;
    const newGroupId = node.groupId ? nodeIdMap.get(node.groupId) : undefined;

    let newNode: Node = {
      ...node,
      id: newNodeId,
      groupId: newGroupId,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
      // Hidden pasted content must not become an invisible selection the next
      // Delete or arrow key would act on sight unseen.
      selected: !hiddenCopiedNodeIds.has(node.id),
    };

    // Update port nodeIds
    newNode = updatePortNodeIds(newNode);

    return newNode;
  });
};

/**
 * Create new edges with updated IDs and references.
 *
 * Endpoints whose node was copied are remapped to the pasted node. An endpoint
 * whose node was NOT copied becomes dangling (empty `source`/`target` with the
 * last routed attachment point as its authored position) — reattaching it to
 * the original node would silently duplicate the original connection. Already
 * dangling endpoints stay dangling. Every free-endpoint position is shifted by
 * the paste offset like every pasted node. An edge whose freed endpoint has no
 * known position (never routed, no points) is skipped — there is nothing to
 * author the free end from.
 */
const createPastedEdges = (
  config: FlowConfig,
  copiedEdges: Edge[],
  nodeIdMap: Map<string, string>,
  hiddenCopiedNodeIds: Set<string>,
  offset: Point
): Edge[] => {
  const pastedEdges: Edge[] = [];

  for (const edge of copiedEdges) {
    const newEdge: Edge = {
      ...edge,
      id: config.computeEdgeId(),
      // See createPastedNodes — hidden pasted edges stay deselected.
      selected: !isEdgeEffectivelyHidden(edge, hiddenCopiedNodeIds),
    };

    const newSource = edge.source ? nodeIdMap.get(edge.source) : '';
    if (newSource !== undefined) {
      newEdge.source = newSource;
    } else {
      const position = edge.sourcePosition ?? edge.points?.at(0);
      if (!position) {
        continue;
      }
      newEdge.source = '';
      newEdge.sourcePort = undefined;
      newEdge.sourcePosition = position;
    }
    if (!newEdge.source && newEdge.sourcePosition) {
      newEdge.sourcePosition = { x: newEdge.sourcePosition.x + offset.x, y: newEdge.sourcePosition.y + offset.y };
    }

    const newTarget = edge.target ? nodeIdMap.get(edge.target) : '';
    if (newTarget !== undefined) {
      newEdge.target = newTarget;
    } else {
      const position = edge.targetPosition ?? edge.points?.at(-1);
      if (!position) {
        continue;
      }
      newEdge.target = '';
      newEdge.targetPort = undefined;
      newEdge.targetPosition = position;
    }
    if (!newEdge.target && newEdge.targetPosition) {
      newEdge.targetPosition = { x: newEdge.targetPosition.x + offset.x, y: newEdge.targetPosition.y + offset.y };
    }

    pastedEdges.push(newEdge);
  }

  return pastedEdges;
};

/**
 * Create updates to deselect currently selected items
 */
const createDeselectUpdates = (
  nodes: Node[],
  edges: Edge[]
): {
  nodesToUpdate: FlowStateUpdate['nodesToUpdate'];
  edgesToUpdate: FlowStateUpdate['edgesToUpdate'];
} => {
  const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];
  const edgesToUpdate: FlowStateUpdate['edgesToUpdate'] = [];

  nodes.forEach((node) => {
    if (node.selected) {
      nodesToUpdate.push({ id: node.id, selected: false });
    }
  });

  edges.forEach((edge) => {
    if (edge.selected) {
      edgesToUpdate.push({ id: edge.id, selected: false });
    }
  });

  return { nodesToUpdate, edgesToUpdate };
};

export const copy = async (commandHandler: CommandHandler) => {
  const { nodes, edges } = commandHandler.flowCore.getState();
  const { modelLookup } = commandHandler.flowCore;

  // Roots: visible selected nodes. Hidden selected elements are skipped —
  // consistent with deleteSelection, so `cut` neither copies nor deletes them.
  const copiedNodeIds = new Set(nodes.filter((node) => node.selected && !node.computedHidden).map((node) => node.id));

  // Cascade: descendants of copied nodes travel with them regardless of their
  // own hidden state (e.g. the hidden children of a copied collapsed group) —
  // mirroring deleteSelection, so cut/paste round-trips a collapsed group.
  for (const id of [...copiedNodeIds]) {
    for (const descendantId of modelLookup.getAllDescendantIds(id)) {
      copiedNodeIds.add(descendantId);
    }
  }

  const copiedNodes = nodes.filter((node) => copiedNodeIds.has(node.id));

  // Edges: explicitly selected visible edges, plus every edge fully inside the
  // copied node set (the internal wiring of copied groups, hidden or not).
  const copiedEdges = edges.filter(
    (edge) =>
      (edge.selected && !edge.computedHidden) || (copiedNodeIds.has(edge.source) && copiedNodeIds.has(edge.target))
  );

  commandHandler.flowCore.actionStateManager.copyPaste = {
    copiedNodes,
    copiedEdges,
  };
};

const applySnappingToNodes = (nodes: Node[], config: FlowConfig): void => {
  for (const node of nodes) {
    node.position = snapNodePosition(config, node, node.position);
  }
};

export const paste = async (commandHandler: CommandHandler, command: PasteCommand) => {
  const copyPasteState = commandHandler.flowCore.actionStateManager.copyPaste;

  if (!copyPasteState || (copyPasteState.copiedNodes.length === 0 && copyPasteState.copiedEdges.length === 0)) {
    return;
  }

  const { nodes, edges } = commandHandler.flowCore.getState();
  const nodeIdMap = new Map<string, string>();

  // Effective visibility WITHIN the copied set (original ids): the copied
  // snapshots carry user `hidden` flags; the template registry does not apply
  // to content that does not exist yet.
  const hiddenCopiedNodeIds = computeHiddenNodeIds(copyPasteState.copiedNodes);

  // Calculate paste offset from the visible copied nodes only — invisible
  // members must not pull the pasted content away from the cursor. Free edge
  // endpoints (pasted dangling) anchor the content just like node positions.
  const visibleCopiedNodes = copyPasteState.copiedNodes.filter((node) => !hiddenCopiedNodeIds.has(node.id));
  const copiedNodeIds = new Set(copyPasteState.copiedNodes.map((node) => node.id));
  const freeEndpointPositions = collectFreeEdgeEndpointPositions(copyPasteState.copiedEdges, copiedNodeIds);
  const offset = calculatePasteOffset(
    visibleCopiedNodes.length > 0 ? visibleCopiedNodes : copyPasteState.copiedNodes,
    freeEndpointPositions,
    command
  );

  // Create new nodes and edges
  const newNodes = createPastedNodes(
    commandHandler.flowCore.config,
    copyPasteState.copiedNodes,
    offset,
    nodeIdMap,
    hiddenCopiedNodeIds
  );
  applySnappingToNodes(newNodes, commandHandler.flowCore.config);
  const newEdges = createPastedEdges(
    commandHandler.flowCore.config,
    copyPasteState.copiedEdges,
    nodeIdMap,
    hiddenCopiedNodeIds,
    offset
  );

  // Nothing pasteable (e.g. the clipboard held only edges whose freed
  // endpoints have no position to dangle from) — leave the current
  // selection untouched.
  if (newNodes.length === 0 && newEdges.length === 0) {
    return;
  }

  // Create deselect updates
  const { nodesToUpdate, edgesToUpdate } = createDeselectUpdates(nodes, edges);

  commandHandler.flowCore.actionStateManager.selection = { selectionChanged: true };

  await commandHandler.flowCore.applyUpdate(
    { nodesToAdd: newNodes, edgesToAdd: newEdges, nodesToUpdate, edgesToUpdate },
    'paste'
  );

  await commandHandler.flowCore.applyUpdate({}, 'selectEnd');
};
