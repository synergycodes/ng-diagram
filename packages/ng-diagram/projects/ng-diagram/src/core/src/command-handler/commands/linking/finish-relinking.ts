import { clearLinkingForGesture } from './linking-gesture';
import type { CommandHandler, Edge, Point } from '../../../types';
import type { EdgeRelinkCancelReason } from '../../../event-manager/event-types';
import type { InternalLinkingActionState } from '../../../types/action-state.interface';
import { alignManualPointsPatch, getPortFlowPosition } from '../../../utils';
import { validateRelinkOrConnection } from './utils';

export interface FinishRelinkingCommand {
  name: 'finishRelinking';
  position?: Point;
}

/**
 * Ends a relink gesture: commits the dragged endpoint to the port it snapped
 * to, detaches it into a dangling end on an empty-canvas drop (when the
 * dangling-edges feature allows), or reverts the edge (which is just clearing
 * the state — the model was never touched during the drag).
 */
export const finishRelinking = async (commandHandler: CommandHandler, command: FinishRelinkingCommand) => {
  const { flowCore } = commandHandler;
  const linking = flowCore.actionStateManager.linking as InternalLinkingActionState | undefined;

  if (!linking?.relink) {
    return;
  }

  // Claims the teardown — a cancelLinking racing this finish must no-op.
  linking._finishing = true;
  const gestureId = linking._gestureId;

  try {
    const { edgeId, end } = linking.relink;
    const temporaryEdge = linking.temporaryEdge;
    linking.dropPosition = command.position ?? { x: 0, y: 0 };
    const dropPosition = linking.dropPosition;

    // An empty 'finishRelinking' pass: the emitter reports the failed relink
    // and the redraw erases the temporary edge and re-shows the original edge.
    const runRevertPass = async (reason: EdgeRelinkCancelReason) => {
      linking.relinkCancelReason = reason;
      await flowCore.applyUpdate({}, 'finishRelinking');
    };

    const edge = flowCore.getEdgeById(edgeId);
    if (!edge || !temporaryEdge) {
      await runRevertPass('cancelled');
      return;
    }

    const candidateNodeId = (end === 'source' ? temporaryEdge.source : temporaryEdge.target) || undefined;
    const candidatePortId = (end === 'source' ? temporaryEdge.sourcePort : temporaryEdge.targetPort) || undefined;

    // The fixed end can become effectively hidden mid-gesture — neither a
    // reconnect nor a detach may commit an edge anchored to a hidden node.
    const fixedEndNodeId = end === 'target' ? edge.source : edge.target;
    if (fixedEndNodeId && flowCore.getNodeById(fixedEndNodeId)?.computedHidden) {
      await runRevertPass('cancelled');
      return;
    }

    if (!candidateNodeId) {
      // Dropped on empty canvas — detach the endpoint when dangling edges are
      // enabled, the relink validator accepts a canvas drop (it receives a
      // null candidate node/port) and the per-edge callback keeps the
      // detached edge.
      const { danglingEdges, edgeRelinking } = flowCore.config;
      if (danglingEdges?.enabled && (edgeRelinking?.validateRelink?.(edge, end, null, null) ?? true)) {
        const detachUpdate: Partial<Edge> & { id: Edge['id'] } =
          end === 'target'
            ? { id: edgeId, target: '', targetPort: undefined, targetPosition: dropPosition }
            : { id: edgeId, source: '', sourcePort: undefined, sourcePosition: dropPosition };
        const detachedEdge: Edge = { ...edge, ...detachUpdate };
        if (!danglingEdges.shouldKeepOnDrop || danglingEdges.shouldKeepOnDrop(detachedEdge, dropPosition)) {
          await flowCore.applyUpdate(
            { edgesToUpdate: [{ ...detachUpdate, ...alignManualPointsPatch(edge, end, dropPosition) }] },
            'finishRelinking'
          );
          return;
        }
      }
      await runRevertPass('noTarget');
      return;
    }

    // Structural checks on the candidate end, mirroring finishLinking's
    // validateTarget: hidden nodes, hidden ports, wrong-direction ports and
    // ports that no longer exist are not valid drop targets.
    const candidateNode = flowCore.getNodeById(candidateNodeId);
    if (!candidateNode || candidateNode.computedHidden) {
      await runRevertPass('invalidConnection');
      return;
    }
    if (candidatePortId) {
      const candidatePort = candidateNode.measuredPorts?.find((port) => port.id === candidatePortId);
      const wrongDirection = end === 'target' ? candidatePort?.type === 'source' : candidatePort?.type === 'target';
      if (
        !candidatePort ||
        wrongDirection ||
        flowCore.templateVisibilityRegistry?.isPortHidden(candidateNodeId, candidatePortId)
      ) {
        await runRevertPass('invalidConnection');
        return;
      }
    }

    const isValid = validateRelinkOrConnection(
      flowCore,
      linking.relink,
      end === 'target' ? edge.source || undefined : candidateNodeId,
      end === 'target' ? edge.sourcePort : candidatePortId,
      end === 'target' ? candidateNodeId : edge.target || undefined,
      end === 'target' ? candidatePortId : edge.targetPort,
      true
    );
    if (!isValid) {
      await runRevertPass('invalidConnection');
      return;
    }

    const reconnectUpdate: Partial<Edge> & { id: Edge['id'] } =
      end === 'target'
        ? { id: edgeId, target: candidateNodeId, targetPort: candidatePortId, targetPosition: undefined }
        : { id: edgeId, source: candidateNodeId, sourcePort: candidatePortId, sourcePosition: undefined };

    // Manual-routing edges keep their stored points verbatim — move the
    // reconnected end's point onto the new anchor so the path follows.
    const newAnchor = candidatePortId ? getPortFlowPosition(candidateNode, candidatePortId) : null;
    const pointsPatch = newAnchor ? alignManualPointsPatch(edge, end, newAnchor) : {};

    await flowCore.applyUpdate({ edgesToUpdate: [{ ...reconnectUpdate, ...pointsPatch }] }, 'finishRelinking');
  } finally {
    clearLinkingForGesture(flowCore.actionStateManager, gestureId);
  }
};
