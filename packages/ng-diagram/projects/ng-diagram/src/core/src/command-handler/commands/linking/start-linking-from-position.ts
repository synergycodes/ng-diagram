import { createLinkingState } from './linking-gesture';
import type { CommandHandler, Point } from '../../../types';
import { createTemporaryEdge } from './utils';

export interface StartLinkingFromPositionCommand {
  name: 'startLinkingFromPosition';
  position: Point;
}

export const startLinkingFromPosition = async (
  commandHandler: CommandHandler,
  command: StartLinkingFromPositionCommand
) => {
  const { position } = command;

  // A draw or relink already owns the linking state — clobbering it would
  // strand its gesture (hidden edge, unbalanced started/ended events).
  if (commandHandler.flowCore.actionStateManager.isLinking()) {
    return;
  }

  const temporaryEdge = createTemporaryEdge(commandHandler.flowCore.config, {
    source: '',
    sourcePosition: position,
    target: '',
    targetPosition: position,
  });

  commandHandler.flowCore.actionStateManager.linking = createLinkingState({
    sourceNodeId: '',
    sourcePortId: '',
    temporaryEdge,
  });

  await commandHandler.flowCore.applyUpdate({}, 'startLinkingFromPosition');
};
