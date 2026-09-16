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

/** One end of an edge: the node it hangs on, its port, its stored position, and where it lands if pasted free. */
interface EdgeEnd {
  nodeId: string;
  port: string | undefined;
  position: Point | undefined;
  // The stored end position, or the matching end of the routed path when no
  // end position is stored (an edge that was never routed has neither).
  freePosition: Point | undefined;
}

const getSourceEnd = (edge: Edge): EdgeEnd => ({
  nodeId: edge.source,
  port: edge.sourcePort,
  position: edge.sourcePosition,
  freePosition: edge.sourcePosition ?? edge.points?.at(0),
});

const getTargetEnd = (edge: Edge): EdgeEnd => ({
  nodeId: edge.target,
  port: edge.targetPort,
  position: edge.targetPosition,
  freePosition: edge.targetPosition ?? edge.points?.at(-1),
});

/** An end is pasted free when it has no node or its node was not copied. */
const isPastedFree = (end: EdgeEnd, copiedNodeIds: Set<string>): boolean =>
  !end.nodeId || !copiedNodeIds.has(end.nodeId);

/** Positions of the edge ends that will be pasted free — they anchor the pasted content at the cursor like node positions do. */
const collectFreeEdgeEndpointPositions = (copiedEdges: Edge[], copiedNodeIds: Set<string>): Point[] => {
  const positions: Point[] = [];

  for (const edge of copiedEdges) {
    for (const end of [getSourceEnd(edge), getTargetEnd(edge)]) {
      if (isPastedFree(end, copiedNodeIds) && end.freePosition) {
        positions.push(end.freePosition);
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

/** Resolves one end of a pasted edge; undefined when the end must be pasted free but has no position. */
const resolvePastedEnd = (end: EdgeEnd, nodeIdMap: Map<string, string>, offset: Point): EdgeEnd | undefined => {
  const pastedNodeId = nodeIdMap.get(end.nodeId);
  if (pastedNodeId) {
    // Node copied too: hang the end on the pasted node, routing recomputes its position.
    return { ...end, nodeId: pastedNodeId };
  }
  if (!end.freePosition) {
    return undefined;
  }
  // Node not copied (or the end was free already): paste the end free at its
  // shifted position. Reattaching it to the original node would silently
  // duplicate the original connection.
  return {
    ...end,
    nodeId: '',
    port: undefined,
    position: { x: end.freePosition.x + offset.x, y: end.freePosition.y + offset.y },
  };
};

/** Create new edges with updated IDs and references; an edge whose free end has no position is skipped. */
const createPastedEdges = (
  config: FlowConfig,
  copiedEdges: Edge[],
  nodeIdMap: Map<string, string>,
  hiddenCopiedNodeIds: Set<string>,
  offset: Point
): Edge[] => {
  const pastedEdges: Edge[] = [];

  for (const edge of copiedEdges) {
    const source = resolvePastedEnd(getSourceEnd(edge), nodeIdMap, offset);
    const target = resolvePastedEnd(getTargetEnd(edge), nodeIdMap, offset);
    if (!source || !target) {
      continue;
    }

    // A manual-routing edge keeps its stored points verbatim, and every end
    // that survives resolvePastedEnd moves by exactly `offset`, so the whole
    // stored path moves with it. Auto-routed edges re-route from their new ends.
    const points =
      edge.routingMode === 'manual' && edge.points
        ? edge.points.map((point) => ({ x: point.x + offset.x, y: point.y + offset.y }))
        : edge.points;

    pastedEdges.push({
      ...edge,
      id: config.computeEdgeId(),
      source: source.nodeId,
      sourcePort: source.port,
      sourcePosition: source.position,
      target: target.nodeId,
      targetPort: target.port,
      targetPosition: target.position,
      points,
      // See createPastedNodes — hidden pasted edges stay deselected.
      selected: !isEdgeEffectivelyHidden(edge, hiddenCopiedNodeIds),
    });
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
  // With dangling edges enabled, "fully inside" counts only the connected
  // endpoints — a dangling edge travels with its one node (a dual dangling
  // edge still only copies when selected). With the feature off the old rule
  // applies unchanged, so the same model copies identically to before.
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
