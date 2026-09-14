import { NgDiagramMath } from '../../math';
import type { CommandHandler, Edge, FlowConfig, FlowStateUpdate, Node, Point } from '../../types';
import { getDanglingEndpoints, hasFreeEndpoint, snapNodePosition } from '../../utils';
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
 * Collect the positions of free (dangling) endpoints among the copied edges.
 * They anchor pasted content the same way node positions do — without them a
 * copied selection of just a dangling edge would have no reference point.
 */
const collectFreeEndpointPositions = (edges: Edge[]): Point[] =>
  getDanglingEndpoints(edges).map((endpoint) => endpoint.position);

/**
 * Calculate the paste position and offset based on command parameters
 */
const calculatePasteOffset = (copiedNodes: Node[], copiedEdges: Edge[], command: PasteCommand): Point => {
  if (!command.position) {
    // Default behavior: offset from original center
    return {
      x: OFFSET,
      y: OFFSET,
    };
  }

  const freeEndpointPositions = collectFreeEndpointPositions(copiedEdges);

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

  // Multiple anchors (node positions and free edge endpoints): maintain
  // relative positioning with their center at cursor
  const anchors = [...copiedNodes.map((node) => node.position), ...freeEndpointPositions];
  if (anchors.length === 0) {
    return { x: OFFSET, y: OFFSET };
  }
  const center = {
    x: anchors.reduce((sum, point) => sum + point.x, 0) / anchors.length,
    y: anchors.reduce((sum, point) => sum + point.y, 0) / anchors.length,
  };
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
 * Create new edges with updated IDs and references
 */
const createPastedEdges = (
  config: FlowConfig,
  copiedEdges: Edge[],
  offset: Point,
  nodeIdMap: Map<string, string>,
  hiddenCopiedNodeIds: Set<string>
): Edge[] => {
  return copiedEdges.map((edge) => {
    const newEdgeId = config.computeEdgeId();

    // Free (dangling) endpoints move with the paste offset like node positions
    // do — otherwise the pasted copy would pin its free end exactly on the
    // original. Manual points travel along so the stored path stays aligned;
    // fully-connected edges get re-routed from their new nodes instead.
    const newEdge: Edge = {
      ...edge,
      id: newEdgeId,
      source: nodeIdMap.get(edge.source) || edge.source,
      target: nodeIdMap.get(edge.target) || edge.target,
      ...(!edge.source && edge.sourcePosition
        ? { sourcePosition: { x: edge.sourcePosition.x + offset.x, y: edge.sourcePosition.y + offset.y } }
        : {}),
      ...(!edge.target && edge.targetPosition
        ? { targetPosition: { x: edge.targetPosition.x + offset.x, y: edge.targetPosition.y + offset.y } }
        : {}),
      ...(hasFreeEndpoint(edge) && edge.points
        ? { points: edge.points.map((point) => ({ x: point.x + offset.x, y: point.y + offset.y })) }
        : {}),
      // See createPastedNodes — hidden pasted edges stay deselected.
      selected: !isEdgeEffectivelyHidden(edge, hiddenCopiedNodeIds),
    };

    return newEdge;
  });
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
  // With dangling edges enabled, "fully inside" counts only the connected
  // endpoints — a dangling edge travels with its one node (a dual dangling
  // edge still only copies when selected).
  const danglingEnabled = commandHandler.flowCore.config.danglingEdges?.enabled;
  const isInsideCopiedSet = (edge: Edge): boolean => {
    if (danglingEnabled) {
      const connectedEndpoints = [edge.source, edge.target].filter(Boolean);
      return connectedEndpoints.length > 0 && connectedEndpoints.every((nodeId) => copiedNodeIds.has(nodeId));
    }
    return copiedNodeIds.has(edge.source) && copiedNodeIds.has(edge.target);
  };
  const copiedEdges = edges.filter((edge) => (edge.selected && !edge.computedHidden) || isInsideCopiedSet(edge));

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
  // members must not pull the pasted content away from the cursor.
  const visibleCopiedNodes = copyPasteState.copiedNodes.filter((node) => !hiddenCopiedNodeIds.has(node.id));
  const offset = calculatePasteOffset(
    visibleCopiedNodes.length > 0 ? visibleCopiedNodes : copyPasteState.copiedNodes,
    copyPasteState.copiedEdges,
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
    offset,
    nodeIdMap,
    hiddenCopiedNodeIds
  );

  // Create deselect updates
  const { nodesToUpdate, edgesToUpdate } = createDeselectUpdates(nodes, edges);

  commandHandler.flowCore.actionStateManager.selection = { selectionChanged: true };

  await commandHandler.flowCore.applyUpdate(
    { nodesToAdd: newNodes, edgesToAdd: newEdges, nodesToUpdate, edgesToUpdate },
    'paste'
  );

  await commandHandler.flowCore.applyUpdate({}, 'selectEnd');
};
