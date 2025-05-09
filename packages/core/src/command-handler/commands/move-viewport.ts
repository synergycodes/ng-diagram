import type { CommandHandler } from '../../types';

export interface MoveViewportByCommand {
  name: 'moveViewportBy';
  x: number;
  y: number;
}

export const moveViewportBy = (commandHandler: CommandHandler, { x, y }: MoveViewportByCommand): void => {
  const { metadata } = commandHandler.flowCore.getState();

  if (!x && !y) {
    return;
  }

  commandHandler.flowCore.applyUpdate(
    {
      metadata: {
        ...metadata,
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

export const moveViewport = (commandHandler: CommandHandler, { x, y }: MoveViewportCommand): void => {
  const { metadata } = commandHandler.flowCore.getState();

  if (x === metadata.viewport.x && y === metadata.viewport.y) {
    return;
  }

  commandHandler.flowCore.applyUpdate(
    {
      metadata: {
        ...metadata,
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
