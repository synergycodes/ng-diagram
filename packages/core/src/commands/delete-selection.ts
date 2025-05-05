import { CommandHandler } from '../types';

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

  const newNodes = isAnyNodeSelected
    ? nodes.filter((node) => {
        if (node.selected) {
          nodesToDeleteIds.push(node.id);
        }
        return !node.selected;
      })
    : nodes;

  const newEdges = edges.filter(
    (edge) => !edge.selected && !nodesToDeleteIds.includes(edge.source) && !nodesToDeleteIds.includes(edge.target)
  );

  commandHandler.flowCore.applyUpdate(
    {
      nodes: newNodes,
      edges: newEdges.length !== edges.length ? newEdges : edges,
    },
    'deleteSelection'
  );
};
