import type { CommandHandler } from '../../types';

export interface ZoomCommand {
  name: 'zoom';
  x: number;
  y: number;
  scale: number;
}

export const zoom = async (commandHandler: CommandHandler, { x, y, scale }: ZoomCommand) => {
  const { metadata } = commandHandler.flowCore.getState();

  if (x === metadata.viewport.x && y === metadata.viewport.y && scale === metadata.viewport.scale) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    { metadataUpdate: { viewport: { ...metadata.viewport, x, y, scale } } },
    'zoom'
  );
};
