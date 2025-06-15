import { normalizeAngle } from '../../input-event-handler/input-actions/rotate/normalize-angle';
import type { CommandHandler } from '../../types';

export interface RotateNodeByCommand {
  name: 'rotateNodeBy';
  nodeId: string;
  angle: number;
}

export const rotateNodeBy = (commandHandler: CommandHandler, { nodeId, angle }: RotateNodeByCommand): void => {
  const node = commandHandler.flowCore.getNodeById(nodeId);

  if (!node) {
    return;
  }

  commandHandler.flowCore.applyUpdate(
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
