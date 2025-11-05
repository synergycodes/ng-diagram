import type { CommandHandler, Edge, FlowStateUpdate, Node } from '../../types';

const changeSelection = (
  nodes: Node[],
  edges: Edge[],
  selectedNodeIds: string[],
  selectedEdgeIds: string[],
  preserveSelection = false
): Pick<FlowStateUpdate, 'nodesToUpdate' | 'edgesToUpdate'> => {
  const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];
  const edgesToUpdate: FlowStateUpdate['edgesToUpdate'] = [];

  nodes.forEach((node) => {
    const isSelected = selectedNodeIds.includes(node.id);
    if (!!node.selected === isSelected || (preserveSelection && !!node.selected)) {
      return;
    }
    nodesToUpdate.push({ id: node.id, selected: isSelected });
  });
  edges.forEach((edge) => {
    const isSelected = selectedEdgeIds.includes(edge.id);
    if (!!edge.selected === isSelected || (preserveSelection && !!edge.selected)) {
      return;
    }
    edgesToUpdate.push({ id: edge.id, selected: isSelected });
  });
  return { nodesToUpdate, edgesToUpdate };
};

export interface SelectCommand {
  name: 'select';
  nodeIds?: string[];
  edgeIds?: string[];
  preserveSelection?: boolean;
}

export const select = async (
  commandHandler: CommandHandler,
  { nodeIds, edgeIds, preserveSelection = false }: SelectCommand
) => {
  const { nodes, edges } = commandHandler.flowCore.getState();
  const { nodesToUpdate, edgesToUpdate } = changeSelection(
    nodes,
    edges,
    nodeIds ?? [],
    edgeIds ?? [],
    preserveSelection
  );
  if (nodesToUpdate?.length === 0 && edgesToUpdate?.length === 0) {
    return;
  }
  await commandHandler.flowCore.applyUpdate({ nodesToUpdate, edgesToUpdate }, 'changeSelection');
};

export interface DeselectCommand {
  name: 'deselect';
  nodeIds?: string[];
  edgeIds?: string[];
}

export const deselect = async (commandHandler: CommandHandler, { nodeIds, edgeIds }: DeselectCommand) => {
  const { nodes, edges } = commandHandler.flowCore.getState();
  const nodeIdSet = new Set<string>(nodeIds);
  const edgeIdSet = new Set<string>(edgeIds);

  const nodesToLeftSelected = nodes.filter(({ id, selected }) => !nodeIdSet.has(id) && !!selected).map(({ id }) => id);

  const edgesToLeftSelected = edges.filter(({ id, selected }) => !edgeIdSet.has(id) && !!selected).map(({ id }) => id);
  const { nodesToUpdate, edgesToUpdate } = changeSelection(
    nodes,
    edges,
    nodesToLeftSelected ?? [],
    edgesToLeftSelected ?? []
  );
  if (nodesToUpdate?.length === 0 && edgesToUpdate?.length === 0) {
    return;
  }
  await commandHandler.flowCore.applyUpdate({ nodesToUpdate, edgesToUpdate }, 'changeSelection');
};

export interface DeselectAllCommand {
  name: 'deselectAll';
}

export const deselectAll = async (commandHandler: CommandHandler) => {
  const { nodes, edges } = commandHandler.flowCore.getState();
  const { nodesToUpdate, edgesToUpdate } = changeSelection(nodes, edges, [], []);
  if (nodesToUpdate?.length === 0 && edgesToUpdate?.length === 0) {
    return;
  }
  await commandHandler.flowCore.applyUpdate({ nodesToUpdate, edgesToUpdate }, 'changeSelection');
};

export interface SelectAllCommand {
  name: 'selectAll';
}

export const selectAll = async (commandHandler: CommandHandler) => {
  const { nodes, edges } = commandHandler.flowCore.getState();
  const allNodeIds = nodes.map((node) => node.id);
  const allEdgeIds = edges.map((edge) => edge.id);
  const { nodesToUpdate, edgesToUpdate } = changeSelection(nodes, edges, allNodeIds, allEdgeIds);
  if (nodesToUpdate?.length === 0 && edgesToUpdate?.length === 0) {
    return;
  }
  await commandHandler.flowCore.applyUpdate({ nodesToUpdate, edgesToUpdate }, 'changeSelection');
};
