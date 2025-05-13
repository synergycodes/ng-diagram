import type { CommandHandler } from '../../types';

export interface ZoomCommand {
  name: 'zoom';
  x: number;
  y: number;
  scale: number;
}

export const zoom = (commandHandler: CommandHandler, { x, y, scale }: ZoomCommand): void => {
  const { metadata } = commandHandler.flowCore.getState();

  if (x === metadata.viewport.x && y === metadata.viewport.y && scale === metadata.viewport.scale) {
    return;
  }

  commandHandler.flowCore.applyUpdate(
    { metadata: { ...metadata, viewport: { ...metadata.viewport, x, y, scale } } },
    'zoom'
  );
};
