import { NgDiagramMath } from '../../math';
import type { CommandHandler } from '../../types';

export interface RotateNodeToCommand {
  name: 'rotateNodeTo';
  nodeId: string;
  angle: number;
}

export const rotateNodeTo = async (commandHandler: CommandHandler, { nodeId, angle }: RotateNodeToCommand) => {
  const node = commandHandler.flowCore.getNodeById(nodeId);
  if (!node) {
    return;
  }

  const currentAngle = node.angle ?? 0;
  if (currentAngle === angle) {
    return;
  }

  const { shouldSnapForNode, computeSnapAngleForNode, defaultSnapAngle } = commandHandler.flowCore.config.nodeRotation;
  const normalizedAngle = NgDiagramMath.normalizeAngle(angle);

  let finalAngle = normalizedAngle;

  if (shouldSnapForNode(node)) {
    const snapAngle = computeSnapAngleForNode(node) ?? defaultSnapAngle;
    finalAngle = NgDiagramMath.snapAngle(normalizedAngle, snapAngle);

    if (finalAngle === currentAngle) {
      return;
    }
  }

  await commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: [
        {
          id: nodeId,
          angle: finalAngle,
        },
      ],
    },
    'rotateNodeTo'
  );
};
