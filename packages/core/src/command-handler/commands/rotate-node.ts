import { normalizeAngle } from '../../input-event-handler/input-actions/rotate/normalize-angle';
import type { CommandHandler, Port } from '../../types';

export interface RotateNodeByCommand {
  name: 'rotateNodeBy';
  nodeId: string;
  angle: number;
  ports: { portId: string; portChanges: Partial<Port> }[];
}

export const rotateNodeBy = (
  commandHandler: CommandHandler,
  { nodeId, angle, ports: portsToUpdate }: RotateNodeByCommand
): void => {
  const node = commandHandler.flowCore.getNodeById(nodeId);

  if (!node) {
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
          id: nodeId,
          angle: normalizeAngle((node.angle ?? 0) + angle),
          ...(ports && { ports }),
        },
      ],
    },
    'rotateNodeBy'
  );
};
