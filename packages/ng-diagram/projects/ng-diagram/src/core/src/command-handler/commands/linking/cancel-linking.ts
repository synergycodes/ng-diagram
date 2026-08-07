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
  linking.cancelReason = 'cancelled';
  linking.dropPosition ??= linking.temporaryEdge?.targetPosition ?? { x: 0, y: 0 };

  // The empty pass emits edgeDrawEnded and erases the temporary edge (see
  // runCancelledFinishPass); the stamped clear in finally survives a throwing
  // middleware and spares a linking that replaced this one mid-pass.
  try {
    await runCancelledFinishPass(commandHandler);
  } finally {
    clearLinkingForGesture(commandHandler.flowCore.actionStateManager, gestureId);
  }
};
