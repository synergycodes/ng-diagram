import type { CommandHandler, Node, Point } from '../../../types';
import { getPortFlowPosition } from '../../../utils';
import { createFinalEdge, validateConnection } from './utils';

export interface FinishLinkingCommand {
  name: 'finishLinking';
}

const clearTemporaryEdge = async (commandHandler: CommandHandler): Promise<void> => {
  commandHandler.flowCore.actionStateManager.clearLinking();
  await commandHandler.flowCore.applyUpdate({}, 'finishLinking');
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

export const finishLinking = async (commandHandler: CommandHandler): Promise<void> => {
  const temporaryEdge = commandHandler.flowCore.actionStateManager.linking?.temporaryEdge;

  if (!temporaryEdge) {
    return;
  }

  const { source, sourcePort, target, targetPort } = temporaryEdge;
  const targetNodeId = target || undefined;
  const targetPortId = targetPort || undefined;

  if (!validateConnection(commandHandler.flowCore, source, sourcePort, targetNodeId, targetPortId, true)) {
    await clearTemporaryEdge(commandHandler);
    return;
  }

  const { isValid, targetPosition } = validateTarget(commandHandler, targetNodeId, targetPortId);

  if (!isValid) {
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
