import { clearLinkingForGesture } from './linking-gesture';
import type { CommandHandler, Point } from '../../../types';
import type { InternalLinkingActionState } from '../../../types/action-state.interface';
import { createFinalEdge } from './utils';

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

  const gestureId = linking._gestureId;

  // Same clear-in-finally + gesture-stamp guard as finishLinking —
  // createFinalEdge runs user callbacks that can throw, and the awaited
  // update pass can reject.
  try {
    if (!temporaryEdge) {
      return;
    }

    linking.dropPosition = position;

    await commandHandler.flowCore.applyUpdate(
      {
        edgesToAdd: [
          createFinalEdge(commandHandler.flowCore.config, temporaryEdge, {
            target: '',
            targetPort: '',
            targetPosition: position,
          }),
        ],
      },
      'finishLinking'
    );
  } finally {
    clearLinkingForGesture(commandHandler.flowCore.actionStateManager, gestureId);
  }
};
