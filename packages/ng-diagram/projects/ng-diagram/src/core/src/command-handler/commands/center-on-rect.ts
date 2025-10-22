import { CommandHandler } from '../../types';
import { isSamePoint } from '../../utils';

export interface CenterOnRectCommand {
  name: 'centerOnRect';
  x: number;
  y: number;
  width: number;
  height: number;
}

export const centerOnRect = async (commandHandler: CommandHandler, { x, y, width, height }: CenterOnRectCommand) => {
  const { viewport } = commandHandler.flowCore.getState().metadata;

  if (!width || !height || width < 0 || height < 0 || !viewport.width || !viewport.height) {
    return;
  }

  const rectCenterX = x + width / 2;
  const rectCenterY = y + height / 2;

  const rectCenterXScaled = rectCenterX * viewport.scale;
  const rectCenterYScaled = rectCenterY * viewport.scale;

  const viewportCenterX = viewport.width / 2;
  const viewportCenterY = viewport.height / 2;

  const newX = viewportCenterX - rectCenterXScaled;
  const newY = viewportCenterY - rectCenterYScaled;

  if (isSamePoint(viewport, { x: newX, y: newY })) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: {
        viewport: {
          ...viewport,
          x: newX,
          y: newY,
        },
      },
    },
    'centerOnRect'
  );
};
