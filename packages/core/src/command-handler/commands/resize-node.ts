import type { CommandHandler, Node } from '../../types';

export interface ResizeNodeCommand {
  name: 'resizeNode';
  id: string;
  size: Required<Node>['size'];
  position?: Node['position'];
  disableAutoSize?: boolean;
}

export const resizeNode = (
  commandHandler: CommandHandler,
  { id, size, position, disableAutoSize }: ResizeNodeCommand
): void => {
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
              position: position ?? node.position,
              ...(disableAutoSize !== undefined && { autoSize: !disableAutoSize }),
            }
          : node
      ),
    },
    'resizeNode'
  );
};
