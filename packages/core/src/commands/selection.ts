import { CommandHandler } from '../types/command-handler.interface';

export interface SelectCommand {
  name: 'select';
  ids: string[];
}

export const select = (commandHandler: CommandHandler, { ids }: SelectCommand): void => {
  commandHandler.flowCore.applyUpdate(
    {
      nodes: commandHandler.flowCore.getState().nodes.map((node) => ({ ...node, selected: ids.includes(node.id) })),
      edges: commandHandler.flowCore.getState().edges.map((edge) => ({ ...edge, selected: ids.includes(edge.id) })),
    },
    'selectionChange'
  );
};

export interface DeselectAllCommand {
  name: 'deselectAll';
}

export const deselectAll = (commandHandler: CommandHandler): void => {
  commandHandler.flowCore.applyUpdate(
    {
      nodes: commandHandler.flowCore.getState().nodes.map((node) => ({ ...node, selected: false })),
      edges: commandHandler.flowCore.getState().edges.map((edge) => ({ ...edge, selected: false })),
    },
    'selectionChange'
  );
};
