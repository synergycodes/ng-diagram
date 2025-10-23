import { CommandHandler, Node, Rect, Viewport } from '../../types';
import { isSamePoint } from '../../utils';

interface CenteringCoordinates {
  x: number;
  y: number;
}

const calculateCenteringCoordinates = (
  { x, y, width, height }: Rect,
  viewport: Viewport
): CenteringCoordinates | null => {
  if (!width || !height || width < 0 || height < 0) {
    return null;
  }

  if (!viewport.width || !viewport.height) {
    return null;
  }

  const rectCenterX = x + width / 2;
  const rectCenterY = y + height / 2;

  const rectCenterXScaled = rectCenterX * viewport.scale;
  const rectCenterYScaled = rectCenterY * viewport.scale;

  const viewportCenterX = viewport.width / 2;
  const viewportCenterY = viewport.height / 2;

  const newX = viewportCenterX - rectCenterXScaled;
  const newY = viewportCenterY - rectCenterYScaled;

  return { x: newX, y: newY };
};

export interface CenterOnRectCommand {
  name: 'centerOnRect';
  rect: Rect;
}

export const centerOnRect = async (commandHandler: CommandHandler, { rect }: CenterOnRectCommand) => {
  const { viewport } = commandHandler.flowCore.getState().metadata;

  const newCoordinates = calculateCenteringCoordinates(rect, viewport);

  if (newCoordinates) {
    if (isSamePoint(viewport, { x: newCoordinates.x, y: newCoordinates.y })) {
      return;
    }

    await commandHandler.flowCore.applyUpdate(
      {
        metadataUpdate: {
          viewport: {
            ...viewport,
            x: newCoordinates.x,
            y: newCoordinates.y,
          },
        },
      },
      'centerOnRect'
    );
  }
};

export interface CenterOnNodeCommand {
  name: 'centerOnNode';
  nodeOrId: string | Node;
}

export const centerOnNode = async (commandHandler: CommandHandler, { nodeOrId }: CenterOnNodeCommand) => {
  const nodeObj = typeof nodeOrId === 'string' ? commandHandler.flowCore.getNodeById(nodeOrId) : nodeOrId;
  const { viewport } = commandHandler.flowCore.getState().metadata;

  if (!nodeObj || !nodeObj.size?.width || !nodeObj.size?.height) {
    return;
  }

  const nodeRectObj: Rect = {
    x: nodeObj.position.x,
    y: nodeObj.position.y,
    width: nodeObj.size.width,
    height: nodeObj.size.height,
  };

  const newCoordinates = calculateCenteringCoordinates(nodeRectObj, viewport);

  if (newCoordinates) {
    if (isSamePoint(viewport, { x: newCoordinates.x, y: newCoordinates.y })) {
      return;
    }

    await commandHandler.flowCore.applyUpdate(
      {
        metadataUpdate: {
          viewport: {
            ...viewport,
            x: newCoordinates.x,
            y: newCoordinates.y,
          },
        },
      },
      'centerOnNode'
    );
  }
};
