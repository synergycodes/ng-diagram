import { clearLinkingForGesture } from './linking-gesture';
import type { CommandHandler, Node, Point } from '../../../types';
import type { InternalLinkingActionState } from '../../../types/action-state.interface';
import { getPortFlowPosition } from '../../../utils';
import { createFinalEdge, validateConnection } from './utils';

export interface FinishLinkingCommand {
  name: 'finishLinking';
  position?: Point;
}

// Empty 'finishLinking' pass: the event-emitter middleware turns the linking
// state (cancelReason, dropPosition) into an edgeDrawEnded event, and the
// commit schedules a redraw that runs after finally has cleared the linking
// state — which is what erases the temporary edge (it is rendered from action
// state, not the model).
const runCancelledFinishPass = async (commandHandler: CommandHandler): Promise<void> => {
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

export const finishLinking = async (commandHandler: CommandHandler, command: FinishLinkingCommand): Promise<void> => {
  const linking = commandHandler.flowCore.actionStateManager.linking as InternalLinkingActionState | undefined;
  const temporaryEdge = linking?.temporaryEdge;

  if (!linking) {
    return;
  }

  const gestureId = linking._gestureId;

  // Clear in finally — a user callback below can throw, and a stranded linking
  // state permanently blocks new links. Guard by gesture stamp, not identity:
  // the linking object is replaced mid-gesture (moveTemporaryEdge, edges-routing).
  try {
    if (!temporaryEdge) {
      await runCancelledFinishPass(commandHandler);
      return;
    }

    linking.dropPosition = command.position ?? { x: 0, y: 0 };

    const { source, sourcePort, target, targetPort } = temporaryEdge;
    const targetNodeId = target || undefined;
    const targetPortId = targetPort || undefined;

    if (!targetNodeId) {
      linking.cancelReason = 'noTarget';
      await runCancelledFinishPass(commandHandler);
      return;
    }

    if (!validateConnection(commandHandler.flowCore, source, sourcePort, targetNodeId, targetPortId, true)) {
      linking.cancelReason = 'invalidConnection';
      await runCancelledFinishPass(commandHandler);
      return;
    }

    const { isValid, targetPosition } = validateTarget(commandHandler, targetNodeId, targetPortId);

    if (!isValid) {
      linking.cancelReason = 'invalidTarget';
      await runCancelledFinishPass(commandHandler);
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
  } finally {
    clearLinkingForGesture(commandHandler.flowCore.actionStateManager, gestureId);
  }
};
