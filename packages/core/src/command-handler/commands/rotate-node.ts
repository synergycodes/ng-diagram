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

  const { computeSnapAngleForNode, shouldSnapForNode, defaultSnapAngle } = commandHandler.flowCore.config.nodeRotation;
  if (shouldSnapForNode(node)) {
    return;
  }

  const snapAngle = computeSnapAngleForNode(node) ?? defaultSnapAngle;
  // TODO: Calculate snapAngle

  return;

  // await commandHandler.flowCore.applyUpdate(
  //   {
  //     nodesToUpdate: [
  //       {
  //         id: nodeId,
  //         angle: normalizeAngle((node.angle ?? 0) + angle),
  //       },
  //     ],
  //   },
  //   'rotateNodeBy'
  // );
};
