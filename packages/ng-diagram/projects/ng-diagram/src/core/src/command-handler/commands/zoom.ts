import type { CommandHandler } from '../../types';

export interface ZoomCommand {
  name: 'zoom';
  x: number;
  y: number;
  scale: number;
}

export const zoom = async (commandHandler: CommandHandler, { x, y, scale }: ZoomCommand) => {
  const { metadata } = commandHandler.flowCore.getState();

  const { min, max } = commandHandler.flowCore.config.zoom;
  if (scale < min || scale > max) {
    console.warn(`Zoom scale ${scale} is out of bounds [${min}, ${max}]`);
    return;
  }

  if (x === metadata.viewport.x && y === metadata.viewport.y && scale === metadata.viewport.scale) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    { metadataUpdate: { viewport: { ...metadata.viewport, x, y, scale } } },
    'zoom'
  );
};
