import { normalizeAngle } from '../../input-events/handlers/rotate/normalize-angle';
import type { CommandHandler } from '../../types';

export interface RotateNodeByCommand {
  name: 'rotateNodeBy';
  nodeId: string;
  angle: number;
}

export const rotateNodeBy = async (commandHandler: CommandHandler, { nodeId, angle }: RotateNodeByCommand) => {
  const node = commandHandler.flowCore.getNodeById(nodeId);

  if (!node || angle === 0) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: [
        {
          id: nodeId,
          angle: normalizeAngle((node.angle ?? 0) + angle),
        },
      ],
    },
    'rotateNodeBy'
  );
};
