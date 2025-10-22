import { CommandHandler, Node } from '../../types';
import { isSamePoint } from '../../utils';

export interface CenterOnNodeCommand {
  name: 'centerOnNode';
  node: string | Node;
}

export const centerOnNode = async (commandHandler: CommandHandler, { node }: CenterOnNodeCommand) => {
  const nodeObj = typeof node === 'string' ? commandHandler.flowCore.getNodeById(node) : node;
  const { viewport } = commandHandler.flowCore.getState().metadata;

  if (!nodeObj || !nodeObj.size?.width || !nodeObj.size?.height) {
    return;
  }

  if (!viewport.width || !viewport.height) {
    return;
  }

  const nodeCenterX = nodeObj.position.x + nodeObj.size.width / 2;
  const nodeCenterY = nodeObj.position.y + nodeObj.size.height / 2;

  const nodeCenterXScaled = nodeCenterX * viewport.scale;
  const nodeCenterYScaled = nodeCenterY * viewport.scale;

  const viewportCenterX = viewport.width / 2;
  const viewportCenterY = viewport.height / 2;

  const newX = viewportCenterX - nodeCenterXScaled;
  const newY = viewportCenterY - nodeCenterYScaled;

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
    'centerOnNode'
  );
};
