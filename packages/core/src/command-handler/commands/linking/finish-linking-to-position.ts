import type { CommandHandler } from '../../../types';
import { createFinalEdge } from './utils';

export interface FinishLinkingToPositionCommand {
  name: 'finishLinkingToPosition';
  position: { x: number; y: number };
}

export const finishLinkingToPosition = async (
  commandHandler: CommandHandler,
  command: FinishLinkingToPositionCommand
) => {
  const { metadata } = commandHandler.flowCore.getState();
  const { position } = command;

  if (!metadata.temporaryEdge) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: { temporaryEdge: null },
      edgesToAdd: [createFinalEdge(metadata.temporaryEdge, { target: '', targetPort: '', targetPosition: position })],
    },
    'finishLinking'
  );
};
