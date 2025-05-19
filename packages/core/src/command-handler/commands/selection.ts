import type { CommandHandler, Edge, FlowState, Node } from '../../types';

const changeSelection = (
  nodes: Node[],
  edges: Edge[],
  selectedNodeIds: string[],
  selectedEdgeIds: string[]
): Pick<FlowState, 'nodes' | 'edges'> => {
  let nodesSelectionChanged = false;
  const newNodes = nodes.map((node) => {
    const isSelected = selectedNodeIds.includes(node.id);
    if (!!node.selected === isSelected) {
      return node;
    }
    nodesSelectionChanged = true;
    return { ...node, selected: isSelected };
  });
  let edgesSelectionChanged = false;
  const newEdges = edges.map((edge) => {
    const isSelected = selectedEdgeIds.includes(edge.id);
    if (!!edge.selected === isSelected) {
      return edge;
    }
    edgesSelectionChanged = true;
    return { ...edge, selected: isSelected };
  });
  return {
    nodes: nodesSelectionChanged ? newNodes : nodes,
    edges: edgesSelectionChanged ? newEdges : edges,
  };
};

const getSelectedIds = (nodes: Node[], edges: Edge[]): { selectedNodeIds: string[]; selectedEdgeIds: string[] } => {
  const selectedNodeIds = nodes.filter((node) => node.selected).map((node) => node.id);
  const selectedEdgeIds = edges.filter((edge) => edge.selected).map((edge) => edge.id);
  return { selectedNodeIds, selectedEdgeIds };
};

export interface SelectCommand {
  name: 'select';
  nodeIds?: string[];
  edgeIds?: string[];
  preserveSelection?: boolean;
}

export const select = (
  commandHandler: CommandHandler,
  { nodeIds, edgeIds, preserveSelection = false }: SelectCommand
): void => {
  const { nodes, edges } = commandHandler.flowCore.getState();
  if (preserveSelection) {
    const { selectedNodeIds, selectedEdgeIds } = getSelectedIds(nodes, edges);
    nodeIds = [...(nodeIds ?? []), ...selectedNodeIds];
    edgeIds = [...(edgeIds ?? []), ...selectedEdgeIds];
  }
  const { nodes: newNodes, edges: newEdges } = changeSelection(nodes, edges, nodeIds ?? [], edgeIds ?? []);
  if (Object.is(nodes, newNodes) && Object.is(edges, newEdges)) {
    return;
  }
  commandHandler.flowCore.applyUpdate({ nodes: newNodes, edges: newEdges }, 'changeSelection');
};

export interface DeselectCommand {
  name: 'deselect';
  nodeIds?: string[];
  edgeIds?: string[];
}

export const deselect = (commandHandler: CommandHandler, { nodeIds, edgeIds }: DeselectCommand): void => {
  const { nodes, edges } = commandHandler.flowCore.getState();
  const { selectedNodeIds, selectedEdgeIds } = getSelectedIds(nodes, edges);
  const newNodeIds = selectedNodeIds.filter((id) => !nodeIds?.includes(id));
  const newEdgeIds = selectedEdgeIds.filter((id) => !edgeIds?.includes(id));
  const { nodes: newNodes, edges: newEdges } = changeSelection(nodes, edges, newNodeIds ?? [], newEdgeIds ?? []);
  if (Object.is(nodes, newNodes) && Object.is(edges, newEdges)) {
    return;
  }
  commandHandler.flowCore.applyUpdate({ nodes: newNodes, edges: newEdges }, 'changeSelection');
};

export interface DeselectAllCommand {
  name: 'deselectAll';
}

export const deselectAll = (commandHandler: CommandHandler): void => {
  const { nodes, edges } = commandHandler.flowCore.getState();
  const { nodes: newNodes, edges: newEdges } = changeSelection(nodes, edges, [], []);
  if (Object.is(nodes, newNodes) && Object.is(edges, newEdges)) {
    return;
  }
  commandHandler.flowCore.applyUpdate({ nodes: newNodes, edges: newEdges }, 'changeSelection');
};
