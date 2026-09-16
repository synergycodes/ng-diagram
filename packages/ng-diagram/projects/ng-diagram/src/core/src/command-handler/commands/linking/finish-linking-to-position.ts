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

  // A relink owns this state (finishRelinking is its only legal finish), and
  // a teardown already in progress must not commit a second edge.
  if (linking.relink || linking._finishing) {
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
            // Free ends carry no port — undefined, never '' (see finishLinking).
            targetPort: undefined,
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
