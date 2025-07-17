import type { CommandHandler } from '../../types';
import type { Edge } from '../../types/edge.interface';

export interface DeleteSelectionCommand {
  name: 'deleteSelection';
}

interface GetEdgesToRemoveParams {
  edges: Edge[];
  nodesToDeleteIds: string[];
}

const getEdgesToRemove = ({ edges, nodesToDeleteIds }: GetEdgesToRemoveParams): string[] => {
  const edgesToDeleteIds = new Set<string>(nodesToDeleteIds);
  return edges
    .filter((edge) => edge.selected || edgesToDeleteIds.has(edge.source) || edgesToDeleteIds.has(edge.target))
    .map((edge) => edge.id);
};

export const deleteSelection = async (commandHandler: CommandHandler) => {
  const { nodes, edges } = commandHandler.flowCore.getState();

  const isAnyNodeSelected = nodes.some((node) => node.selected);
  const isAnyEdgeSelected = edges.some((edge) => edge.selected);

  if (!isAnyNodeSelected && !isAnyEdgeSelected) {
    return;
  }

  const nodesToDeleteIds = isAnyNodeSelected
    ? commandHandler.flowCore.modelLookup.getSelectedNodesWithChildren().map((node) => node.id)
    : [];
  const edgesToDeleteIds = getEdgesToRemove({ edges, nodesToDeleteIds });

  if (nodesToDeleteIds.length === 0 && edgesToDeleteIds.length === 0) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    { nodesToRemove: nodesToDeleteIds, edgesToRemove: edgesToDeleteIds },
    'deleteSelection'
  );
};
