import { NgDiagramMath } from '../../math';
import type { CommandHandler } from '../../types';

export interface RotateNodeToCommand {
  name: 'rotateNodeTo';
  nodeId: string;
  angle: number;
}

const CARDINAL_ANGLES = [0, 90, 180, 270];
export const MICRO_SNAP_THRESHOLD = 2;

export const microSnapToCardinal = (angle: number): number => {
  const normalized = NgDiagramMath.normalizeAngle(angle);

  for (const cardinal of CARDINAL_ANGLES) {
    const distance = Math.abs(normalized - cardinal);

    const wrapDistance = Math.min(distance, 360 - distance);

    if (wrapDistance <= MICRO_SNAP_THRESHOLD) {
      return cardinal;
    }
  }

  return normalized;
};

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
  } else {
    finalAngle = microSnapToCardinal(finalAngle);

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
