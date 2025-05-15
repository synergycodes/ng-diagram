import type { CommandHandler } from '../../types';

export interface ControlNodeSizeCommand {
  name: 'controlNodeSize';
  id: string;
  sizeControlled: boolean;
}

export const controlNodeSize = (
  commandHandler: CommandHandler,
  { id, sizeControlled }: ControlNodeSizeCommand
): void => {
  const { nodes } = commandHandler.flowCore.getState();
  const node = nodes.find((node) => node.id === id);
  if (!node || node.sizeControlled === sizeControlled) {
    return;
  }

  commandHandler.flowCore.applyUpdate(
    {
      nodes: nodes.map((node) => (node.id === id ? { ...node, sizeControlled } : node)),
    },
    'controlNodeSize'
  );
};
