import { clearLinkingForGesture } from './linking-gesture';
import type { CommandHandler, Edge, Node, Point } from '../../../types';
import type { InternalLinkingActionState } from '../../../types/action-state.interface';
import { getPortFlowPosition } from '../../../utils';
import { createFinalEdge, validateConnection } from './utils';

export interface FinishLinkingCommand {
  name: 'finishLinking';
  position?: Point;
}

// Empty 'finishLinking' pass: the emitter turns the linking state into an
// edgeDrawEnded event and the commit's redraw erases the temporary edge.
// Callers clear the state themselves (stamped, in their finally).
export const runCancelledFinishPass = async (commandHandler: CommandHandler): Promise<void> => {
  await commandHandler.flowCore.applyUpdate({}, 'finishLinking');
};

/**
 * Builds the dangling edge kept on a drop over empty canvas, or returns null
 * when the drop should fall back to the cancelled pass (feature off, hidden
 * source, or the user callback declined). The final edge is built BEFORE the
 * callback runs so `shouldKeepOnDrop` sees what would actually be committed
 * (after `finalEdgeDataBuilder`).
 */
export const buildKeptDanglingEdge = (
  commandHandler: CommandHandler,
  temporaryEdge: Edge,
  dropPosition: Point
): Edge | null => {
  const { config } = commandHandler.flowCore;
  if (!config.danglingEdges?.enabled) {
    return null;
  }

  // Mirror the connected path's guard — a hidden source must not silently
  // produce an invisible dangling edge.
  if (temporaryEdge.source && commandHandler.flowCore.getNodeById(temporaryEdge.source)?.computedHidden) {
    return null;
  }

  // A free end has no port — normalized to undefined (never '') so the model
  // shape is identical across every path that produces a dangling end.
  const edge = createFinalEdge(config, temporaryEdge, {
    target: '',
    targetPort: undefined,
    targetPosition: dropPosition,
  });

  if (config.danglingEdges.shouldKeepOnDrop && !config.danglingEdges.shouldKeepOnDrop(edge, dropPosition)) {
    return null;
  }

  return edge;
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

  // Effectively hidden nodes and hidden ports are not linking targets.
  if (targetNode.computedHidden) {
    return { isValid: false, targetNode, targetPosition: null };
  }

  if (
    targetPortId &&
    (targetNode.measuredPorts?.find((port) => port.id === targetPortId)?.type === 'source' ||
      commandHandler.flowCore.templateVisibilityRegistry?.isPortHidden(targetNode.id, targetPortId))
  ) {
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

  // A relink owns this state — finishing it as a draw would ADD a duplicate
  // edge instead of updating the relinked one (finishRelinking is the only
  // legal finish for it). A teardown already in progress must not run twice.
  if (linking.relink || linking._finishing) {
    return;
  }

  // Claims the teardown — a cancelLinking racing this finish must no-op instead
  // of overwriting the reason and emitting a second edgeDrawEnded.
  linking._finishing = true;
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
      const { config } = commandHandler.flowCore;
      // A drop over a port the preview refused (wrong direction, or the source's
      // own port) is not an empty-canvas drop: no dangling edge is kept and the
      // draw cancels with 'noTarget' exactly as with the feature off.
      const droppedOnPort =
        !!config.danglingEdges?.enabled &&
        !!commandHandler.flowCore.getNearestPortInRange(linking.dropPosition, config.linking.portSnapDistance);

      const keptEdge = droppedOnPort
        ? null
        : buildKeptDanglingEdge(commandHandler, temporaryEdge, linking.dropPosition);
      if (keptEdge) {
        await commandHandler.flowCore.applyUpdate({ edgesToAdd: [keptEdge] }, 'finishLinking');
        return;
      }
      linking.cancelReason = 'noTarget';
      await runCancelledFinishPass(commandHandler);
      return;
    }

    // The source can become effectively hidden mid-gesture (a model update
    // while the user drags). Mirror startLinking's guard — a hidden source
    // must not silently produce an invisible edge.
    if (commandHandler.flowCore.getNodeById(source)?.computedHidden) {
      linking.cancelReason = 'cancelled';
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
