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

  if (!linking) {
    return;
  }

  const gestureId = linking._gestureId;
  linking.cancelReason = 'cancelled';
  linking.dropPosition ??= linking.temporaryEdge?.targetPosition ?? { x: 0, y: 0 };

  // Mirror finishLinking: run the 'finishLinking' pass so the edgeDrawEnded
  // emitter observes the cancellation, then clear the linking state in finally
  // (gesture-stamped, so a state replaced mid-gesture is not wrongly cleared).
  try {
    await runCancelledFinishPass(commandHandler);
  } finally {
    clearLinkingForGesture(commandHandler.flowCore.actionStateManager, gestureId);
  }
};
