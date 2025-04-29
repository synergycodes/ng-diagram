import { CommandHandler } from '../types/command-handler.interface';

export interface DeleteSelectionCommand {
  name: 'deleteSelection';
}

export const deleteSelection = (commandHandler: CommandHandler): void => {
  const { nodes, edges } = commandHandler.flowCore.getState();

  const isAnyNodeSelected = nodes.some((node) => node.selected);
  const isAnyEdgeSelected = edges.some((edge) => edge.selected);

  if (!isAnyEdgeSelected && !isAnyNodeSelected) {
    return;
  }

  commandHandler.flowCore.applyUpdate(
    {
      nodes: isAnyNodeSelected ? nodes.filter((node) => !node.selected) : nodes,
      edges: isAnyEdgeSelected ? edges.filter((edge) => !edge.selected) : edges,
    },
    'deleteSelection'
  );
};
