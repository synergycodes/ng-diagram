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

  const temporaryEdge = createTemporaryEdge(commandHandler.flowCore.config, {
    source: '',
    sourcePosition: position,
    target: '',
    targetPosition: position,
  });

  commandHandler.flowCore.actionStateManager.linking = {
    sourceNodeId: '',
    sourcePortId: '',
    temporaryEdge,
  };

  await commandHandler.flowCore.applyUpdate({}, 'startLinkingFromPosition');
};
