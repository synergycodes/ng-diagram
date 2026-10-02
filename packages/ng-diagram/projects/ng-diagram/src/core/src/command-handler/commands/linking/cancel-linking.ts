import type { CommandHandler } from '../../../types';
import type { InternalLinkingActionState } from '../../../types/action-state.interface';
import { runCancelledFinishPass } from './finish-linking';
import { clearLinkingForGesture } from './linking-gesture';

export interface CancelLinkingCommand {
  name: 'cancelLinking';
}

/**
 * Aborts an in-progress linking gesture without creating an edge.
 *
 * Removes the temporary edge, clears the linking action state and lets the
 * `edgeDrawEnded` event fire with the `cancelled` reason. No-op when no
 * linking is in progress.
 */
export const cancelLinking = async (commandHandler: CommandHandler): Promise<void> => {
  const linking = commandHandler.flowCore.actionStateManager.linking as InternalLinkingActionState | undefined;

  // No linking, or a finishLinking/another cancel already owns the teardown.
  if (!linking || linking._finishing) {
    return;
  }

  linking._finishing = true;
  const gestureId = linking._gestureId;
  // The dragged end is the one that followed the pointer — for a source-end
  // relink that is the source, not the target.
  const draggedEndPosition =
    linking.relink?.end === 'source' ? linking.temporaryEdge?.sourcePosition : linking.temporaryEdge?.targetPosition;
  linking.dropPosition ??= draggedEndPosition ?? { x: 0, y: 0 };

  // The empty pass emits edgeDrawEnded (or edgeRelinkEnded for a relink
  // gesture) and erases the temporary edge (see runCancelledFinishPass); the
  // stamped clear in finally survives a throwing middleware and spares a
  // linking that replaced this one mid-pass.
  try {
    if (linking.relink) {
      linking.relinkCancelReason = 'cancelled';
      await commandHandler.flowCore.applyUpdate({}, 'finishRelinking');
    } else {
      linking.cancelReason = 'cancelled';
      await runCancelledFinishPass(commandHandler);
    }
  } finally {
    clearLinkingForGesture(commandHandler.flowCore.actionStateManager, gestureId);
  }
};
