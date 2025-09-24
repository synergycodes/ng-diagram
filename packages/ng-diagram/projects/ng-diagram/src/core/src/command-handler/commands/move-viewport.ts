import type { CommandHandler } from '../../types';
import { isSamePoint } from '../../utils';

export interface MoveViewportByCommand {
  name: 'moveViewportBy';
  x: number;
  y: number;
}

export const moveViewportBy = async (commandHandler: CommandHandler, { x, y }: MoveViewportByCommand) => {
  const { metadata } = commandHandler.flowCore.getState();

  if (!x && !y) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: {
        viewport: {
          ...metadata.viewport,
          x: metadata.viewport.x + x,
          y: metadata.viewport.y + y,
        },
      },
    },
    'moveViewport'
  );
};

export interface MoveViewportCommand {
  name: 'moveViewport';
  x: number;
  y: number;
}

export const moveViewport = async (commandHandler: CommandHandler, command: MoveViewportCommand) => {
  const { x, y } = command;
  const { metadata } = commandHandler.flowCore.getState();

  if (isSamePoint(metadata.viewport, { x, y })) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: {
        viewport: {
          ...metadata.viewport,
          x,
          y,
        },
      },
    },
    'moveViewport'
  );
};
