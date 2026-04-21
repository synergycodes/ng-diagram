import type { CommandHandler, Node, Point } from '../../../types';
import { getPortFlowPosition } from '../../../utils';
import { createFinalEdge, validateConnection } from './utils';

export interface FinishLinkingCommand {
  name: 'finishLinking';
  position?: Point;
}

const clearTemporaryEdge = async (commandHandler: CommandHandler): Promise<void> => {
  await commandHandler.flowCore.applyUpdate({}, 'finishLinking');
  commandHandler.flowCore.actionStateManager.clearLinking();
};

const validateTarget = (
  commandHandler: CommandHandler,
  targetNodeId: string | undefined,
  targetPortId: string | undefined
): { isValid: boolean; targetNode: Node | null; targetPosition: Point | null } => {
  const targetNode = targetNodeId && commandHandler.flowCore.getNodeById(targetNodeId);

  if (!targetNode) {
    return { isValid: false, targetNode: null, targetPosition: null };
  }

  if (targetPortId && targetNode.measuredPorts?.find((port) => port.id === targetPortId)?.type === 'source') {
    return { isValid: false, targetNode, targetPosition: null };
  }

  const targetPosition =
    targetNodeId && targetPortId ? getPortFlowPosition(targetNode, targetPortId) : targetNode.position;

  if (!targetPosition) {
    return { isValid: false, targetNode, targetPosition: null };
  }

  return { isValid: true, targetNode, targetPosition };
};

export const finishLinking = async (commandHandler: CommandHandler, command: FinishLinkingCommand): Promise<void> => {
  const linking = commandHandler.flowCore.actionStateManager.linking;
  const temporaryEdge = linking?.temporaryEdge;

  if (!linking) {
    return;
  }

  if (!temporaryEdge) {
    await clearTemporaryEdge(commandHandler);
    return;
  }

  linking.dropPosition = command.position ?? { x: 0, y: 0 };

  const { source, sourcePort, target, targetPort } = temporaryEdge;
  const targetNodeId = target || undefined;
  const targetPortId = targetPort || undefined;

  if (!targetNodeId) {
    linking.cancelReason = 'noTarget';
    await clearTemporaryEdge(commandHandler);
    return;
  }

  if (!validateConnection(commandHandler.flowCore, source, sourcePort, targetNodeId, targetPortId, true)) {
    linking.cancelReason = 'invalidConnection';
    await clearTemporaryEdge(commandHandler);
    return;
  }

  const { isValid, targetPosition } = validateTarget(commandHandler, targetNodeId, targetPortId);

  if (!isValid) {
    linking.cancelReason = 'invalidTarget';
    await clearTemporaryEdge(commandHandler);
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      edgesToAdd: [
        createFinalEdge(commandHandler.flowCore.config, temporaryEdge, {
          target: targetNodeId,
          targetPort: targetPortId,
          targetPosition: targetPosition || undefined,
        }),
      ],
    },
    'finishLinking'
  );

  commandHandler.flowCore.actionStateManager.clearLinking();
};
