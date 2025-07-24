import type { CommandHandler } from '../../../types';
import { createTemporaryEdge } from './utils';

export interface StartLinkingFromPositionCommand {
  name: 'startLinkingFromPosition';
  position: { x: number; y: number };
}

export const startLinkingFromPosition = async (
  commandHandler: CommandHandler,
  command: StartLinkingFromPositionCommand
) => {
  const { position } = command;

  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: {
        temporaryEdge: createTemporaryEdge(commandHandler.flowCore, {
          source: '',
          sourcePosition: position,
          target: '',
          targetPosition: position,
        }),
      },
    },
    'startLinking'
  );
};
