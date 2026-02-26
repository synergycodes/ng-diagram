import type { CommandHandler, Edge, FlowConfig, FlowStateUpdate, Node, Point } from '../../types';

const OFFSET = 20;

export interface CopyCommand {
  name: 'copy';
}

export interface PasteCommand {
  name: 'paste';
  position?: Point;
}

/**
 * Calculate the center point of a collection of nodes
 */
const calculateNodeCenter = (nodes: Node[]): Point => {
  if (nodes.length === 0) {
    return { x: 0, y: 0 };
  }

  const centerX = nodes.reduce((sum, node) => sum + node.position.x, 0) / nodes.length;
  const centerY = nodes.reduce((sum, node) => sum + node.position.y, 0) / nodes.length;

  return { x: centerX, y: centerY };
};

/**
 * Calculate the paste position and offset based on command parameters
 */
const calculatePasteOffset = (copiedNodes: Node[], command: PasteCommand): Point => {
  const center = calculateNodeCenter(copiedNodes);

  if (!command.position) {
    // Default behavior: offset from original center
    return {
      x: OFFSET,
      y: OFFSET,
    };
  }

  if (copiedNodes.length === 1) {
    // Single node: center the node at cursor position, accounting for node size
    const singleNode = copiedNodes[0];
    const nodeWidth = singleNode.size?.width ?? 0;
    const nodeHeight = singleNode.size?.height ?? 0;

    // Calculate position so that cursor is at the center of the node
    const targetX = command.position.x - nodeWidth / 2;
    const targetY = command.position.y - nodeHeight / 2;

    return {
      x: targetX - singleNode.position.x,
      y: targetY - singleNode.position.y,
    };
  }

  // Multiple nodes: maintain relative positioning with center at cursor
  return {
    x: command.position.x - center.x,
    y: command.position.y - center.y,
  };
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
  nodeIdMap: Map<string, string>
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
      selected: true,
    };

    // Update port nodeIds
    newNode = updatePortNodeIds(newNode);

    return newNode;
  });
};

/**
 * Create new edges with updated IDs and references
 */
const createPastedEdges = (config: FlowConfig, copiedEdges: Edge[], nodeIdMap: Map<string, string>): Edge[] => {
  return copiedEdges.map((edge) => {
    const newEdgeId = config.computeEdgeId();
    const newEdge: Edge = {
      ...edge,
      id: newEdgeId,
      source: nodeIdMap.get(edge.source) || edge.source,
      target: nodeIdMap.get(edge.target) || edge.target,
      selected: true,
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

  const copiedNodes = nodes.filter((node) => node.selected);
  const copiedEdges = edges.filter((edge) => edge.selected);

  commandHandler.flowCore.actionStateManager.copyPaste = {
    copiedNodes,
    copiedEdges,
  };
};

export const paste = async (commandHandler: CommandHandler, command: PasteCommand) => {
  const copyPasteState = commandHandler.flowCore.actionStateManager.copyPaste;

  if (!copyPasteState || (copyPasteState.copiedNodes.length === 0 && copyPasteState.copiedEdges.length === 0)) {
    return;
  }

  const { nodes, edges } = commandHandler.flowCore.getState();
  const nodeIdMap = new Map<string, string>();

  // Calculate paste offset
  const offset = calculatePasteOffset(copyPasteState.copiedNodes, command);

  // Create new nodes and edges
  const newNodes = createPastedNodes(commandHandler.flowCore.config, copyPasteState.copiedNodes, offset, nodeIdMap);
  const newEdges = createPastedEdges(commandHandler.flowCore.config, copyPasteState.copiedEdges, nodeIdMap);

  // Create deselect updates
  const { nodesToUpdate, edgesToUpdate } = createDeselectUpdates(nodes, edges);

  commandHandler.flowCore.actionStateManager.selection = { selectionChanged: true };

  await commandHandler.flowCore.applyUpdate(
    { nodesToAdd: newNodes, edgesToAdd: newEdges, nodesToUpdate, edgesToUpdate },
    'paste'
  );

  await commandHandler.flowCore.applyUpdate({}, 'selectEnd');
};
