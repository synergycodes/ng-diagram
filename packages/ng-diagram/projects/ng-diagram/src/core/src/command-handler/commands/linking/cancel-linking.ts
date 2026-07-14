import type { CommandHandler } from '../../../types';
import { clearTemporaryEdge } from './finish-linking';

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
  const linking = commandHandler.flowCore.actionStateManager.linking;

  if (!linking) {
    return;
  }

  linking.cancelReason = 'cancelled';
  linking.dropPosition ??= linking.temporaryEdge?.targetPosition ?? { x: 0, y: 0 };

  await clearTemporaryEdge(commandHandler);
};
