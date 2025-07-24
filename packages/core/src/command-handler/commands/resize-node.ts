import type { Bounds, CommandHandler, Node } from '../../types';
import { calculateGroupBounds, isSameSize } from '../../utils';

export const MIN_NODE_SIZE = 200;

export interface ResizeNodeCommand {
  name: 'resizeNode';
  id: string;
  size: Required<Node>['size'];
  position?: Node['position'];
  disableAutoSize?: boolean;
}

/**
 * Applies minimum size constraints to a resize operation, adjusting position
 * when necessary to maintain the resize operation's intent.
 */
function applyMinimumSizeConstraints(
  requestedSize: Required<Node>['size'],
  requestedPosition: Node['position'] | undefined,
  originalPosition: Node['position']
): { size: Required<Node>['size']; position: Node['position'] } {
  const constrainedWidth = Math.max(requestedSize.width, MIN_NODE_SIZE);
  const constrainedHeight = Math.max(requestedSize.height, MIN_NODE_SIZE);

  if (!requestedPosition) {
    return {
      size: { width: constrainedWidth, height: constrainedHeight },
      position: originalPosition,
    };
  }

  let constrainedX = requestedPosition.x;
  let constrainedY = requestedPosition.y;

  // If width was constrained and position moved right from original, adjust it back
  if (constrainedWidth !== requestedSize.width && requestedPosition.x > originalPosition.x) {
    const widthDifference = constrainedWidth - requestedSize.width;
    constrainedX = requestedPosition.x - widthDifference;
  }

  // If height was constrained and position moved down from original, adjust it back
  if (constrainedHeight !== requestedSize.height && requestedPosition.y > originalPosition.y) {
    const heightDifference = constrainedHeight - requestedSize.height;
    constrainedY = requestedPosition.y - heightDifference;
  }

  return {
    size: { width: constrainedWidth, height: constrainedHeight },
    position: { x: constrainedX, y: constrainedY },
  };
}

/**
 * Applies children bounds constraints to ensure group fully contains all children.
 * Expands the requested group bounds if necessary to accommodate children.
 */
export function applyChildrenBoundsConstraints(
  requestedSize: Required<Node>['size'],
  requestedPosition: Node['position'],
  childrenBounds: Bounds
): { size: Required<Node>['size']; position: Node['position'] } {
  const requestedBounds: Bounds = {
    minX: requestedPosition.x,
    minY: requestedPosition.y,
    maxX: requestedPosition.x + requestedSize.width,
    maxY: requestedPosition.y + requestedSize.height,
  };

  const finalBounds: Bounds = {
    minX: Math.min(requestedBounds.minX, childrenBounds.minX),
    minY: Math.min(requestedBounds.minY, childrenBounds.minY),
    maxX: Math.max(requestedBounds.maxX, childrenBounds.maxX),
    maxY: Math.max(requestedBounds.maxY, childrenBounds.maxY),
  };

  return {
    size: {
      width: finalBounds.maxX - finalBounds.minX,
      height: finalBounds.maxY - finalBounds.minY,
    },
    position: {
      x: finalBounds.minX,
      y: finalBounds.minY,
    },
  };
}

export async function resizeNode(commandHandler: CommandHandler, command: ResizeNodeCommand) {
  const node = commandHandler.flowCore.getNodeById(command.id);

  if (!node) {
    throw new Error(`Node with id ${command.id} not found.`);
  }
  if (isSameSize(node.size, command.size) || (node.isGroup && !node.selected)) {
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

  if (!command.size) {
    return;
  }

  const childrenBounds = calculateGroupBounds(children, node, { useGroupRect: false });

  const { size: constrainedSize, position: constrainedPosition } = applyMinimumSizeConstraints(
    command.size,
    command.position,
    node.position
  );

  const { size: finalSize, position: finalPosition } = applyChildrenBoundsConstraints(
    constrainedSize,
    constrainedPosition,
    childrenBounds
  );

  await commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: [
        {
          id: command.id,
          size: finalSize,
          position: finalPosition,
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
  if (!command.size) {
    return;
  }
  const node = commandHandler.flowCore.getNodeById(command.id);
  if (!node) {
    return;
  }

  const { size: constrainedSize, position: constrainedPosition } = applyMinimumSizeConstraints(
    command.size,
    command.position,
    node.position
  );

  await commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: [
        {
          id: command.id,
          size: constrainedSize,
          position: constrainedPosition,
          ...(command.disableAutoSize !== undefined && { autoSize: !command.disableAutoSize }),
        },
      ],
    },
    'resizeNode'
  );
}
