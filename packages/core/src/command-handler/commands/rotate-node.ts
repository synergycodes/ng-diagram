import { NgDiagramMath } from '../../math';
import type { CommandHandler } from '../../types';
import type { Node } from '../../types/node.interface';

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

  const { shouldSnapForNode } = commandHandler.flowCore.config.nodeRotation;
  if (shouldSnapForNode(node)) {
    return await rotateNodeWithSnap(commandHandler, node, angle);
  }

  const nextAngle = NgDiagramMath.normalizeAngle((node.angle ?? 0) + angle);
  await commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: [
        {
          id: nodeId,
          angle: nextAngle,
        },
      ],
    },
    'rotateNodeBy'
  );
};

const rotateNodeWithSnap = async (commandHandler: CommandHandler, node: Node, angle: number) => {
  const { computeSnapAngleForNode, defaultSnapAngle } = commandHandler.flowCore.config.nodeRotation;
  const snapAngle = computeSnapAngleForNode(node) ?? defaultSnapAngle;

  const nextAngle = NgDiagramMath.normalizeAngle((node.angle ?? 0) + angle);
  const isSnapMeaningful = (nextAngle ?? 0) % snapAngle !== 0;

  if (!isSnapMeaningful) {
    return;
  }

  const snappedAngle = NgDiagramMath.snapAngle(nextAngle ?? 0, snapAngle);

  await commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: [
        {
          id: node.id,
          angle: snappedAngle,
        },
      ],
    },
    'rotateNodeBy'
  );
};
