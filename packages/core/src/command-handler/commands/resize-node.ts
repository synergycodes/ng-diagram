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
  { id, size, position, disableAutoSize, ports: portsToUpdate }: ResizeNodeCommand
): void => {
  const { nodes } = commandHandler.flowCore.getState();
  const node = nodes.find((node) => node.id === id);

  if (!node || (node.size?.width === size.width && node.size?.height === size.height)) {
    return;
  }

  const ports =
    node.ports && portsToUpdate && portsToUpdate.length > 0
      ? node.ports.map((port) => {
          const portChanges = portsToUpdate.find(({ portId }) => portId === port.id)?.portChanges;

          if (!portChanges) {
            return port;
          }

          return {
            ...port,
            ...portChanges,
          };
        })
      : null;

  commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: [
        {
          id,
          size,
          ...(position && { position }),
          ...(disableAutoSize !== undefined && { autoSize: !disableAutoSize }),
          ...(ports && { ports }),
        },
      ],
    },
    'resizeNode'
  );
};
