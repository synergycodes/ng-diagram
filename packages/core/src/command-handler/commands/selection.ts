import type { CommandHandler, Edge, FlowState, Node } from '../../types';

const changeSelection = (nodes: Node[], edges: Edge[], ids: string[]): Pick<FlowState, 'nodes' | 'edges'> => {
  return {
    nodes: nodes.map((node) => {
      const isSelected = ids.includes(node.id);
      if (node.selected === isSelected) {
        return node;
      }
      return { ...node, selected: isSelected };
    }),
    edges: edges.map((edge) => {
      const isSelected = ids.includes(edge.id);
      if (edge.selected === isSelected) {
        return edge;
      }
      return { ...edge, selected: isSelected };
    }),
  };
};

export interface SelectCommand {
  name: 'select';
  ids: string[];
}

export const select = (commandHandler: CommandHandler, { ids }: SelectCommand): void => {
  const { nodes, edges } = commandHandler.flowCore.getState();
  commandHandler.flowCore.applyUpdate(changeSelection(nodes, edges, ids), 'changeSelection');
};

export interface DeselectAllCommand {
  name: 'deselectAll';
}

export const deselectAll = (commandHandler: CommandHandler): void => {
  const { nodes, edges } = commandHandler.flowCore.getState();
  commandHandler.flowCore.applyUpdate(changeSelection(nodes, edges, []), 'changeSelection');
};
