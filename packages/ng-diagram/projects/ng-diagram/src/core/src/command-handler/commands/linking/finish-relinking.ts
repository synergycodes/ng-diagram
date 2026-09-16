import { clearLinkingForGesture } from './linking-gesture';
import type { CommandHandler, Edge, Point } from '../../../types';
import type { EdgeRelinkCancelReason } from '../../../event-manager/event-types';
import type { InternalLinkingActionState } from '../../../types/action-state.interface';
import { alignManualPointsPatch, getPortFlowPosition } from '../../../utils';
import { getTargetPortInfo } from './move-temporary-edge';
import { connectionContextForGesture, isValidEndpointTarget, validateConnection } from './utils';

export interface FinishRelinkingCommand {
  name: 'finishRelinking';
  /** The drop position in flow coordinates. */
  position: Point;
}

/**
 * Ends a relink gesture: commits the dragged endpoint to the port under the
 * drop position, detaches it into a dangling end on an empty-canvas drop
 * (when the dangling-edges feature allows), or reverts the edge (which is
 * just clearing the state — the model was never touched during the drag).
 *
 * A drop back on the endpoint's original node and port changes nothing and
 * reports `success: false, reason: 'cancelled'`.
 */
export const finishRelinking = async (commandHandler: CommandHandler, command: FinishRelinkingCommand) => {
  const { flowCore } = commandHandler;
  const linking = flowCore.actionStateManager.linking as InternalLinkingActionState | undefined;

  // No relink, or a finishRelinking/cancelLinking already owns the teardown —
  // a second call must not commit twice or emit a second edgeRelinkEnded.
  if (!linking?.relink || linking._finishing) {
    return;
  }

  // Claims the teardown — a cancelLinking racing this finish must no-op.
  linking._finishing = true;
  const gestureId = linking._gestureId;

  try {
    const { edgeId, end } = linking.relink;
    const temporaryEdge = linking.temporaryEdge;
    const dropPosition = command.position;
    linking.dropPosition = dropPosition;

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

    // Hit-test the drop position itself rather than trusting the preview:
    // moveTemporaryEdge un-snaps candidates the validator rejects, so the
    // preview can't distinguish "no port under the cursor" from "port the
    // validator refused" — and the latter must report invalidConnection.
    const dropPortInfo = getTargetPortInfo(commandHandler, dropPosition, temporaryEdge, end);
    const candidateNodeId = dropPortInfo.targetNodeId || undefined;
    const candidatePortId = dropPortInfo.targetPortId || undefined;

    // A drop back on the original node and port is a no-op, not a reconnect:
    // the model is untouched and no success is reported (event parity with
    // edgeRelinkStarted is kept through the cancelled revert pass).
    const originalNodeId = (end === 'source' ? edge.source : edge.target) || undefined;
    const originalPortId = (end === 'source' ? edge.sourcePort : edge.targetPort) || undefined;
    if (candidateNodeId && candidateNodeId === originalNodeId && candidatePortId === originalPortId) {
      await runRevertPass('cancelled');
      return;
    }

    // The fixed end can become effectively hidden mid-gesture — neither a
    // reconnect nor a detach may commit an edge anchored to a hidden node.
    const fixedEndNodeId = end === 'target' ? edge.source : edge.target;
    if (fixedEndNodeId && flowCore.getNodeById(fixedEndNodeId)?.computedHidden) {
      await runRevertPass('cancelled');
      return;
    }

    if (!candidateNodeId) {
      // Dropped on empty canvas — detach the endpoint when dangling edges are
      // enabled and the per-edge callback keeps the detached edge. This is not
      // a connection, so the connection validator is not consulted.
      const { danglingEdges } = flowCore.config;
      if (danglingEdges?.enabled) {
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
    if (!isValidEndpointTarget(flowCore, end, candidateNodeId, candidatePortId)) {
      await runRevertPass('invalidConnection');
      return;
    }
    const candidateNode = flowCore.getNodeById(candidateNodeId);

    const isValid = validateConnection(
      flowCore,
      end === 'target' ? edge.source || undefined : candidateNodeId,
      end === 'target' ? edge.sourcePort : candidatePortId,
      end === 'target' ? candidateNodeId : edge.target || undefined,
      end === 'target' ? candidatePortId : edge.targetPort,
      true,
      connectionContextForGesture(flowCore, linking.relink)
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
    const newAnchor = candidatePortId && candidateNode ? getPortFlowPosition(candidateNode, candidatePortId) : null;
    const pointsPatch = newAnchor ? alignManualPointsPatch(edge, end, newAnchor) : {};

    await flowCore.applyUpdate({ edgesToUpdate: [{ ...reconnectUpdate, ...pointsPatch }] }, 'finishRelinking');
  } finally {
    clearLinkingForGesture(flowCore.actionStateManager, gestureId);
  }
};
