import type { Bounds, CommandHandler, FlowConfig, GroupNode, Node } from '../../types';
import { calculateGroupBounds, isSameSize } from '../../utils';
import { isGroup } from '../../utils/is-group';

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
  flowConfig: FlowConfig,
  node: Node,
  requestedSize: Required<Node>['size'],
  requestedPosition: Node['position'] | undefined,
  originalPosition: Node['position']
): { size: Required<Node>['size']; position: Node['position'] | undefined } {
  const constrainedWidth = Math.max(requestedSize.width, flowConfig.resize.getMinNodeSize(node).width);
  const constrainedHeight = Math.max(requestedSize.height, flowConfig.resize.getMinNodeSize(node).height);

  if (!requestedPosition) {
    return {
      size: { width: constrainedWidth, height: constrainedHeight },
      position: requestedPosition,
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
  requestedPosition: Node['position'] | undefined,
  originalPosition: Node['position'],
  childrenBounds: Bounds
): { size: Required<Node>['size']; position: Node['position'] } {
  const requestedBounds: Bounds = {
    minX: requestedPosition?.x ?? originalPosition.x,
    minY: requestedPosition?.y ?? originalPosition.y,
    maxX: (requestedPosition?.x ?? originalPosition.x) + requestedSize.width,
    maxY: (requestedPosition?.y ?? originalPosition.y) + requestedSize.height,
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

  // The node is missing size, which can happen when a node is dropped from the palette
  // and the initial size is not set. In this case, we handle it separately.
  if (!node.size && command.size) {
    await handleMissingInitialSize(commandHandler, command);
    return;
  }

  if (isSameSize(node.size, command.size) || (isGroup(node) && !node.selected)) {
    return;
  }

  if (isGroup(node)) {
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
  node: GroupNode
): Promise<void> {
  const children = commandHandler.flowCore.modelLookup.getNodeChildren(command.id, { directOnly: false });

  if (children.length === 0) {
    // if the group has no children, we fallback to single node mode
    await handleSingleNodeResize(commandHandler, command);
    return;
  }

  const childrenBounds = calculateGroupBounds(children, node, { useGroupRect: false });

  const { size: constrainedSize, position: constrainedPosition } = applyMinimumSizeConstraints(
    commandHandler.flowCore.config,
    node,
    command.size,
    command.position,
    node.position
  );

  const { size: finalSize, position: finalPosition } = applyChildrenBoundsConstraints(
    constrainedSize,
    constrainedPosition,
    node.position,
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
  const node = commandHandler.flowCore.getNodeById(command.id);
  if (!node) {
    return;
  }

  const { size: constrainedSize, position: constrainedPosition } = applyMinimumSizeConstraints(
    commandHandler.flowCore.config,
    node,
    command.size,
    command.position,
    node.position
  );

  const updateData: Partial<Node> & { id: Node['id'] } = {
    id: command.id,
    size: constrainedSize,
    ...(command.disableAutoSize !== undefined && { autoSize: !command.disableAutoSize }),
  };

  if (command.position) {
    updateData.position = constrainedPosition;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: [updateData],
    },
    'resizeNode'
  );
}

/**
 * Handles missing initial size in case of dropping from the palette
 */
async function handleMissingInitialSize(commandHandler: CommandHandler, command: ResizeNodeCommand): Promise<void> {
  const node = commandHandler.flowCore.getNodeById(command.id);
  if (!node) {
    return;
  }

  await commandHandler.emit('updateNode', {
    id: command.id,
    nodeChanges: {
      size: command.size,
    },
  });
}
