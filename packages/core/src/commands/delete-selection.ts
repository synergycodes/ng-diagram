import { CommandHandler } from '../types/command-handler.interface';

export interface DeleteSelectionCommand {
  name: 'deleteSelection';
}

export const deleteSelection = (commandHandler: CommandHandler): void => {
  const { nodes, edges } = commandHandler.flowCore.getState();

  const selectedEdges = edges.filter((edge) => edge.selected);
  const selectedNodes = nodes.filter((node) => node.selected);

  if (selectedNodes.length === 0 && selectedEdges.length === 0) {
    return;
  }

  commandHandler.flowCore.applyUpdate(
    {
      nodes: selectedNodes.length > 0 ? nodes.filter((node) => !selectedNodes.includes(node)) : nodes,
      edges: selectedEdges.length > 0 ? edges.filter((edge) => !selectedEdges.includes(edge)) : edges,
    },
    'deleteSelection'
  );
};
