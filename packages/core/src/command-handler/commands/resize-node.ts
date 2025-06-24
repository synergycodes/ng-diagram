import type { Bounds, CommandHandler, Node, Port, Rect } from '../../types';
import { getRectFromBounds } from '../../utils';
import { calculateGroupBounds } from '../../utils/group-size';

export interface ResizeNodeCommand {
  name: 'resizeNode';
  id: string;
  size: Required<Node>['size'];
  position?: Node['position'];
  disableAutoSize?: boolean;
  ports?: { portId: string; portChanges: Partial<Port> }[];
}

export const resizeNode = (
  commandHandler: CommandHandler,
  { id, size, position, disableAutoSize }: ResizeNodeCommand
): void => {
  const node = commandHandler.flowCore.getNodeById(id);

  if (!node || (node.size?.width === size.width && node.size?.height === size.height)) {
    return;
  }

  if (node.isGroup) {
    const children = commandHandler.flowCore.modelLookup.getNodeChildren(id, { directOnly: false });
    const childrenBounds = calculateGroupBounds(children, node, { useGroupRect: false });

    // Calculate the new bounds based on the resize request
    const requestedBounds: Bounds = {
      minX: position?.x ?? node.position.x,
      minY: position?.y ?? node.position.y,
      maxX: (position?.x ?? node.position.x) + size.width,
      maxY: (position?.y ?? node.position.y) + size.height,
    };

    // Ensure the new bounds fully contain the children bounds
    const newGroupRect: Rect = getRectFromBounds({
      minX: Math.min(requestedBounds.minX, childrenBounds.minX),
      minY: Math.min(requestedBounds.minY, childrenBounds.minY),
      maxX: Math.max(requestedBounds.maxX, childrenBounds.maxX),
      maxY: Math.max(requestedBounds.maxY, childrenBounds.maxY),
    });

    commandHandler.flowCore.applyUpdate(
      {
        nodesToUpdate: [
          {
            id,
            size: {
              width: newGroupRect.width,
              height: newGroupRect.height,
            },
            position: {
              x: newGroupRect.x,
              y: newGroupRect.y,
            },
            autoSize: false,
          },
        ],
      },
      'resizeNode'
    );
  } else {
    commandHandler.flowCore.applyUpdate(
      {
        nodesToUpdate: [
          {
            id,
            size,
            ...(position && { position }),
            ...(disableAutoSize !== undefined && { autoSize: !disableAutoSize }),
          },
        ],
      },
      'resizeNode'
    );
  }
};
