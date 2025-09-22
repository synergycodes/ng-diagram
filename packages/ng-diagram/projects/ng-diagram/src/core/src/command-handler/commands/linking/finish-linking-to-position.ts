import type { CommandHandler, Point } from '../../../types';
import { createFinalEdge } from './utils';

export interface FinishLinkingToPositionCommand {
  name: 'finishLinkingToPosition';
  position: Point;
}

export const finishLinkingToPosition = async (
  commandHandler: CommandHandler,
  command: FinishLinkingToPositionCommand
) => {
  const temporaryEdge = commandHandler.flowCore.actionStateManager.linking?.temporaryEdge;
  const { position } = command;

  if (!temporaryEdge) {
    return;
  }

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

  commandHandler.flowCore.actionStateManager.clearLinking();
};
