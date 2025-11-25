import { NgDiagramMath } from '../../math';
import type { Bounds, CommandHandler, FlowConfig, GroupNode, Node, Size } from '../../types';
import { calculateGroupBounds, isGroup, isSameSize } from '../../utils';

/** @internal */
export const RESIZE_NODE_NOT_FOUND_ERROR = (nodeId: string) =>
  `[ngDiagram] Resize node failed: Node not found.

Node ID: ${nodeId}

This may occur if the node was deleted before the resize command executed.

Documentation: https://www.ngdiagram.dev/docs/guides/nodes/nodes/`;

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
const applyMinimumSizeConstraints = (
  flowConfig: FlowConfig,
  node: Node,
  requestedSize: Required<Node>['size'],
  requestedPosition: Node['position'] | undefined,
  originalPosition: Node['position']
): { size: Required<Node>['size']; position: Node['position'] | undefined } => {
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
};

/**
 * Applies children bounds constraints to ensure group fully contains all children.
 * Expands the requested group bounds if necessary to accommodate children.
 */
export const applyChildrenBoundsConstraints = (
  requestedSize: Required<Node>['size'],
  requestedPosition: Node['position'] | undefined,
  originalPosition: Node['position'],
  childrenBounds: Bounds
): { size: Required<Node>['size']; position: Node['position'] } => {
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
};

export const resizeNode = async (commandHandler: CommandHandler, command: ResizeNodeCommand) => {
  const node = commandHandler.flowCore.getNodeById(command.id);

  if (!node) {
    console.error(RESIZE_NODE_NOT_FOUND_ERROR(command.id));
    return;
  }

  // The node is missing size, which can happen when a node is dropped from the palette
  // and the initial size is not set. In this case, we handle it separately.
  if (!node.size && command.size) {
    await handleMissingInitialSize(commandHandler, command);
    return;
  }

  if (!command.size) {
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
};

/**
 * Handles resizing of a group node, ensuring children are contained.
 */
const handleGroupNodeResize = async (
  commandHandler: CommandHandler,
  command: ResizeNodeCommand,
  node: GroupNode
): Promise<void> => {
  const children = commandHandler.flowCore.modelLookup.getNodeChildren(command.id, { directOnly: false });

  if (children.length === 0) {
    // if the group has no children, we fallback to single node mode
    await handleSingleNodeResize(commandHandler, command);
    return;
  }

  const childrenBounds = calculateGroupBounds(children, node, {
    useGroupRect: false,
    allowResizeBelowChildrenBounds: commandHandler.flowCore.config.resize.allowResizeBelowChildrenBounds,
  });

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

  await applySnappingIfNeeded(commandHandler, node, finalPosition, finalSize, true);
};

/**
 * Handles resizing of a single (non-group) node.
 */
const handleSingleNodeResize = async (commandHandler: CommandHandler, command: ResizeNodeCommand): Promise<void> => {
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

  await applySnappingIfNeeded(commandHandler, node, constrainedPosition, constrainedSize, command.disableAutoSize);
};

/**
 * Handles missing initial size in case of dropping from the palette
 */
const handleMissingInitialSize = async (commandHandler: CommandHandler, command: ResizeNodeCommand): Promise<void> => {
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
};

const applySnappingIfNeeded = async (
  commandHandler: CommandHandler,
  node: Node,
  nextPosition: Node['position'] | undefined,
  nextSize: Node['size'],
  nextDisableAutoSize: boolean | undefined
) => {
  const flowConfig = commandHandler.flowCore.config;

  if (!flowConfig.snapping.shouldSnapResizeForNode(node)) {
    const updateData: Partial<Node> & { id: Node['id'] } = {
      id: node.id,
      size: nextSize,
      ...(nextDisableAutoSize !== undefined && { autoSize: !nextDisableAutoSize }),
    };

    if (nextPosition) {
      updateData.position = nextPosition;
    }

    return await commandHandler.flowCore.applyUpdate(
      {
        nodesToUpdate: [updateData],
      },
      'resizeNode'
    );
  }
  return await computeAndApplySnapping(commandHandler, node, nextPosition, nextSize, nextDisableAutoSize);
};

/**
 * Calculates snapped dimensions considering position changes when resizing from edges.
 * When resizing from left/top edges, the size must be calculated relative to the snapped position
 * to maintain the opposite edge's position and prevent jittering.
 */
const calculateSnappedDimensions = (
  node: Node,
  nextPosition: Node['position'] | undefined,
  nextSize: Node['size'],
  snappedPosition: Node['position'] | undefined,
  snapping: Size
): Size => {
  const prevWidth = node.size?.width ?? 0;
  const prevHeight = node.size?.height ?? 0;
  const nodeWidth = nextSize?.width ?? prevWidth;
  const nodeHeight = nextSize?.height ?? prevHeight;
  const movedX = nextPosition && node.position.x !== nextPosition.x;
  const movedY = nextPosition && node.position.y !== nextPosition.y;

  let width = nodeWidth;
  let height = nodeHeight;

  // Calculate width considering position snap when resizing from left edge
  if (prevWidth !== nodeWidth) {
    if (snappedPosition && movedX) {
      // Maintain right edge position when left edge moves
      width = Math.round(node.position.x + prevWidth) - snappedPosition.x;
    } else {
      width = NgDiagramMath.snapNumber(nodeWidth, snapping.width);
    }
  }

  // Calculate height considering position snap when resizing from top edge
  if (prevHeight !== nodeHeight) {
    if (snappedPosition && movedY) {
      // Maintain bottom edge position when top edge moves
      height = Math.max(Math.round(node.position.y + prevHeight) - snappedPosition.y, 0);
    } else {
      height = NgDiagramMath.snapNumber(nodeHeight, snapping.height);
    }
  }

  return { width, height };
};

const computeAndApplySnapping = async (
  commandHandler: CommandHandler,
  node: Node,
  nextPosition: Node['position'] | undefined,
  nextSize: Node['size'],
  nextDisableAutoSize: boolean | undefined
) => {
  const { computeSnapForNodeSize, defaultResizeSnap } = commandHandler.flowCore.config.snapping;
  const snapping = computeSnapForNodeSize(node) ?? defaultResizeSnap;
  const snappedPosition = nextPosition && NgDiagramMath.snapPoint(nextPosition, snapping);

  const { width, height } = calculateSnappedDimensions(node, nextPosition, nextSize, snappedPosition, snapping);

  const updateData: Partial<Node> & { id: Node['id'] } = {
    id: node.id,
    size: { width, height },
    ...(nextDisableAutoSize !== undefined && { autoSize: !nextDisableAutoSize }),
  };

  if (snappedPosition) {
    updateData.position = snappedPosition;
  }

  await commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: [updateData],
    },
    'resizeNode'
  );
};
