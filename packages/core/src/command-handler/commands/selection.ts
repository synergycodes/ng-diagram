import type { CommandHandler, Edge, FlowStateUpdate, Node } from '../../types';

const changeSelection = (
  nodes: Node[],
  edges: Edge[],
  selectedNodeIds: string[],
  selectedEdgeIds: string[]
): Pick<FlowStateUpdate, 'nodesToUpdate' | 'edgesToUpdate'> => {
  const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];
  const edgesToUpdate: FlowStateUpdate['edgesToUpdate'] = [];

  nodes.forEach((node) => {
    const isSelected = selectedNodeIds.includes(node.id);
    if (!!node.selected === isSelected) {
      return;
    }
    nodesToUpdate.push({ id: node.id, selected: isSelected });
  });
  edges.map((edge) => {
    const isSelected = selectedEdgeIds.includes(edge.id);
    if (!!edge.selected === isSelected) {
      return;
    }
    edgesToUpdate.push({ id: edge.id, selected: isSelected });
  });
  return { nodesToUpdate, edgesToUpdate };
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
  const { nodesToUpdate, edgesToUpdate } = changeSelection(nodes, edges, nodeIds ?? [], edgeIds ?? []);
  if (nodesToUpdate?.length === 0 && edgesToUpdate?.length === 0) {
    return;
  }
  commandHandler.flowCore.applyUpdate({ nodesToUpdate, edgesToUpdate }, 'changeSelection');
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
  const { nodesToUpdate, edgesToUpdate } = changeSelection(nodes, edges, newNodeIds ?? [], newEdgeIds ?? []);
  if (nodesToUpdate?.length === 0 && edgesToUpdate?.length === 0) {
    return;
  }
  commandHandler.flowCore.applyUpdate({ nodesToUpdate, edgesToUpdate }, 'changeSelection');
};

export interface DeselectAllCommand {
  name: 'deselectAll';
}

export const deselectAll = (commandHandler: CommandHandler): void => {
  const { nodes, edges } = commandHandler.flowCore.getState();
  const { nodesToUpdate, edgesToUpdate } = changeSelection(nodes, edges, [], []);
  if (nodesToUpdate?.length === 0 && edgesToUpdate?.length === 0) {
    return;
  }
  commandHandler.flowCore.applyUpdate({ nodesToUpdate, edgesToUpdate }, 'changeSelection');
};
