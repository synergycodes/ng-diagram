import type { CommandHandler } from '../../types';

export interface DeleteSelectionCommand {
  name: 'deleteSelection';
}

export const deleteSelection = (commandHandler: CommandHandler): void => {
  const { nodes, edges } = commandHandler.flowCore.getState();

  const isAnyNodeSelected = nodes.some((node) => node.selected);
  if (!isAnyNodeSelected) {
    const isAnyEdgeSelected = edges.some((edge) => edge.selected);
    if (!isAnyEdgeSelected) {
      return;
    }
  }

  const nodesToDeleteIds: string[] = [];

  if (isAnyNodeSelected) {
    nodes.forEach((node) => {
      if (node.selected) {
        nodesToDeleteIds.push(node.id);
      }
    });
  }

  const edgesToDeleteIds: string[] = [];
  edges.forEach((edge) => {
    if (edge.selected || nodesToDeleteIds.includes(edge.source) || nodesToDeleteIds.includes(edge.target)) {
      edgesToDeleteIds.push(edge.id);
    }
  });

  commandHandler.flowCore.applyUpdate(
    { nodesToRemove: nodesToDeleteIds, edgesToRemove: edgesToDeleteIds },
    'deleteSelection'
  );
};
