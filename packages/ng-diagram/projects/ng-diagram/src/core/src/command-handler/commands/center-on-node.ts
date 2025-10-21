import { CommandHandler, Node } from '../../types';
import { isSamePoint } from '../../utils';

export interface CenterOnNodeCommand {
  name: 'centerOnNode';
  node: string | Node;
}

export const centerOnNode = async (commandHandler: CommandHandler, { node }: CenterOnNodeCommand) => {
  const nodeObj = typeof node === 'string' ? commandHandler.flowCore.getNodeById(node) : node;
  const { metadata } = commandHandler.flowCore.getState();

  if (!nodeObj) {
    throw new Error(`Node with id ${node} not found.`);
  }

  if (!nodeObj.size || nodeObj.size?.width === undefined || nodeObj.size?.height === undefined) {
    throw new Error(`Size properties are not provided for the node with id ${node}`);
  }

  const nodeCenterPoint: { x: number; y: number } = {
    x: nodeObj.position.x + nodeObj.size?.width / 2,
    y: nodeObj.position.y + nodeObj.size?.height / 2,
  };

  if (isSamePoint(metadata.viewport, { x: nodeCenterPoint.x, y: nodeCenterPoint.y })) {
    return;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: {
        viewport: {
          ...metadata.viewport,
          x: nodeCenterPoint.x,
          y: nodeCenterPoint.y,
        },
      },
    },
    'centerOnNode'
  );
};
