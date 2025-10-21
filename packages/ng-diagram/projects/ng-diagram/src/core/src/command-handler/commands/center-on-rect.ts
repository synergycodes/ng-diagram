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
  const { metadata } = commandHandler.flowCore.getState();

  const rectCenterPoint: { x: number; y: number } = {
    x: x + width / 2,
    y: y + height / 2,
  };

  if (isSamePoint(metadata.viewport, { x: rectCenterPoint.x, y: rectCenterPoint.y })) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: {
        viewport: {
          ...metadata.viewport,
          x: rectCenterPoint.x,
          y: rectCenterPoint.y,
        },
      },
    },
    'centerOnRect'
  );
};
