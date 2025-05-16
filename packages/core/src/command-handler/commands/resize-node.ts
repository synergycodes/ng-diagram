import type { CommandHandler, Node } from '../../types';

export interface ResizeNodeCommand {
  name: 'resizeNode';
  id: string;
  size: Required<Node>['size'];
  disableAutoSize?: boolean;
}

export const resizeNode = (commandHandler: CommandHandler, { id, size, disableAutoSize }: ResizeNodeCommand): void => {
  const { nodes } = commandHandler.flowCore.getState();
  const node = nodes.find((node) => node.id === id);
  if (!node || (node.size?.width === size.width && node.size?.height === size.height)) {
    return;
  }
  commandHandler.flowCore.applyUpdate(
    {
      nodes: nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              size,
              ...(disableAutoSize !== undefined && { autoSize: !disableAutoSize }),
            }
          : node
      ),
    },
    'resizeNode'
  );
};
