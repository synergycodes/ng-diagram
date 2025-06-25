import type { Bounds, CommandHandler, Node, Rect } from '../../types';
import { getRectFromBounds } from '../../utils';
import { calculateGroupBounds } from '../../utils/group-size';

export interface ResizeNodeCommand {
  name: 'resizeNode';
  id: string;
  size: Required<Node>['size'];
  position?: Node['position'];
  disableAutoSize?: boolean;
}

export async function resizeNode(commandHandler: CommandHandler, command: ResizeNodeCommand) {
  const node = commandHandler.flowCore.getNodeById(command.id);

  if (!node) {
    throw new Error(`Node with id ${command.id} not found.`);
  }

  if (node.size?.width === command.size.width && node.size?.height === command.size.height) {
    return; // No-op if size is unchanged
  }

  if (node.isGroup) {
    await handleGroupNodeResize(commandHandler, command, node);
  } else {
    await handleSingleNodeResize(commandHandler, command);
  }
}

/**
 * Handles resizing of a group node, ensuring children are contained.
 */
async function handleGroupNodeResize(
  commandHandler: CommandHandler,
  command: ResizeNodeCommand,
  node: Node
): Promise<void> {
  const children = commandHandler.flowCore.modelLookup.getNodeChildren(command.id, { directOnly: false });

  if (children.length === 0) {
    // if the group has no children, we fallback to single node mode
    await handleSingleNodeResize(commandHandler, command);
    return;
  }

  const childrenBounds = calculateGroupBounds(children, node, { useGroupRect: false });

  // Calculate the new bounds based on the resize request
  const requestedBounds: Bounds = {
    minX: command.position?.x ?? node.position.x,
    minY: command.position?.y ?? node.position.y,
    maxX: (command.position?.x ?? node.position.x) + command.size.width,
    maxY: (command.position?.y ?? node.position.y) + command.size.height,
  };

  // Ensure the new bounds fully contain the children bounds
  const newGroupRect: Rect = getRectFromBounds({
    minX: Math.min(requestedBounds.minX, childrenBounds.minX),
    minY: Math.min(requestedBounds.minY, childrenBounds.minY),
    maxX: Math.max(requestedBounds.maxX, childrenBounds.maxX),
    maxY: Math.max(requestedBounds.maxY, childrenBounds.maxY),
  });

  await commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: [
        {
          id: command.id,
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
}

/**
 * Handles resizing of a single (non-group) node.
 */
async function handleSingleNodeResize(commandHandler: CommandHandler, command: ResizeNodeCommand): Promise<void> {
  await commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: [
        {
          id: command.id,
          size: command.size,
          ...(command.position && { position: command.position }),
          ...(command.disableAutoSize !== undefined && { autoSize: !command.disableAutoSize }),
        },
      ],
    },
    'resizeNode'
  );
}
