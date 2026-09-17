import { buildKeptDanglingEdge, runCancelledFinishPass } from './finish-linking';
import { clearLinkingForGesture } from './linking-gesture';
import type { CommandHandler, Point } from '../../../types';
import type { InternalLinkingActionState } from '../../../types/action-state.interface';

export interface FinishLinkingToPositionCommand {
  name: 'finishLinkingToPosition';
  position: Point;
}

export const finishLinkingToPosition = async (
  commandHandler: CommandHandler,
  command: FinishLinkingToPositionCommand
) => {
  const linking = commandHandler.flowCore.actionStateManager.linking as InternalLinkingActionState | undefined;
  const temporaryEdge = linking?.temporaryEdge;
  const { position } = command;

  if (!linking) {
    return;
  }

  // A relink owns this state (finishRelinking is its only legal finish), and
  // a teardown already in progress must not commit a second edge.
  if (linking.relink || linking._finishing) {
    return;
  }

  // Claims the teardown — a cancelLinking racing this finish must no-op.
  linking._finishing = true;
  const gestureId = linking._gestureId;

  // Same clear-in-finally + gesture-stamp guard as finishLinking — building
  // the final edge runs user callbacks that can throw, and the awaited update
  // pass can reject.
  try {
    if (!temporaryEdge) {
      return;
    }

    linking.dropPosition = position;

    // The drop lands on empty canvas by construction, so it goes through the
    // same dangling-edges gate as finishLinking: feature flag, hidden source
    // and shouldKeepOnDrop all decide whether an edge is kept.
    const keptEdge = buildKeptDanglingEdge(commandHandler, temporaryEdge, position);
    if (!keptEdge) {
      linking.cancelReason = 'noTarget';
      await runCancelledFinishPass(commandHandler);
      return;
    }

    await commandHandler.flowCore.applyUpdate({ edgesToAdd: [keptEdge] }, 'finishLinking');
  } finally {
    clearLinkingForGesture(commandHandler.flowCore.actionStateManager, gestureId);
  }
};
