import type { CommandHandler, Node, Port } from '../../types';

export interface ResizeNodeCommand {
  name: 'resizeNode';
  id: string;
  size: Required<Node>['size'];
  position?: Node['position'];
  disableAutoSize?: boolean;
  ports?: { portId: string; portChanges: Partial<Port> }[];
}

export const resizeNode = (
  commandHandler: CommandHandler,
  { id, size, position, disableAutoSize }: ResizeNodeCommand
): void => {
  const node = commandHandler.flowCore.getNodeById(id);

  if (!node || (node.size?.width === size.width && node.size?.height === size.height)) {
    return;
  }

  commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: [
        {
          id,
          size,
          ...(position && { position }),
          ...(disableAutoSize !== undefined && { autoSize: !disableAutoSize }),
        },
      ],
    },
    'resizeNode'
  );
};
