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
  const linking = commandHandler.flowCore.actionStateManager.linking;
  const temporaryEdge = linking?.temporaryEdge;
  const { position } = command;

  if (!temporaryEdge || !linking) {
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

  commandHandler.flowCore.actionStateManager.clearLinking();
};
