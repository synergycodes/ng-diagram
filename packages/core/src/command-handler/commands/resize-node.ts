import type { CommandHandler, Node } from '../../types';

export interface ResizeNodeCommand {
  name: 'resizeNode';
  id: string;
  size: Required<Node>['size'];
}

export const resizeNode = (commandHandler: CommandHandler, { id, size }: ResizeNodeCommand): void => {
  const { nodes } = commandHandler.flowCore.getState();
  const node = nodes.find((node) => node.id === id);
  if (
    !node ||
    (node.size?.width === size.width && node.size?.height === size.height && node.size?.controlled === size.controlled)
  ) {
    return;
  }
  commandHandler.flowCore.applyUpdate(
    {
      nodes: nodes.map((node) => (node.id === id ? { ...node, size: { ...(node.size || {}), ...size } } : node)),
    },
    'resizeNode'
  );
};
