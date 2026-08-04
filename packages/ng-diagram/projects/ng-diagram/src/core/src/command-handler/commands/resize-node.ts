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
 * Applies minimum size constraints to a non-snapping resize, adjusting position
 * when necessary to maintain the resize operation's intent. The snapping path
 * enforces the minimum itself, after the snap.
 */
const applyMinimumSizeConstraints = (
  flowConfig: FlowConfig,
  node: Node,
  requestedSize: Size,
  requestedPosition: Node['position'] | undefined
): { size: Size; position: Node['position'] | undefined } => {
  const minSize = flowConfig.resize.getMinNodeSize(node);
  const constrainedWidth = Math.max(requestedSize.width, minSize.width);
  const constrainedHeight = Math.max(requestedSize.height, minSize.height);

  if (!requestedPosition) {
    return {
      size: { width: constrainedWidth, height: constrainedHeight },
      position: requestedPosition,
    };
  }

  let constrainedX = requestedPosition.x;
  let constrainedY = requestedPosition.y;

  // If width was constrained and position moved right from original, adjust it back
  if (constrainedWidth !== requestedSize.width && requestedPosition.x > node.position.x) {
    const widthDifference = constrainedWidth - requestedSize.width;
    constrainedX = requestedPosition.x - widthDifference;
  }

  // If height was constrained and position moved down from original, adjust it back
  if (constrainedHeight !== requestedSize.height && requestedPosition.y > node.position.y) {
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
    left: requestedPosition?.x ?? originalPosition.x,
    top: requestedPosition?.y ?? originalPosition.y,
    right: (requestedPosition?.x ?? originalPosition.x) + requestedSize.width,
    bottom: (requestedPosition?.y ?? originalPosition.y) + requestedSize.height,
  };

  const finalBounds: Bounds = {
    left: Math.min(requestedBounds.left, childrenBounds.left),
    top: Math.min(requestedBounds.top, childrenBounds.top),
    right: Math.max(requestedBounds.right, childrenBounds.right),
    bottom: Math.max(requestedBounds.bottom, childrenBounds.bottom),
  };

  return {
    size: {
      width: finalBounds.right - finalBounds.left,
      height: finalBounds.bottom - finalBounds.top,
    },
    position: {
      x: finalBounds.left,
      y: finalBounds.top,
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

  if (isSameSize(node.size, command.size)) {
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

  // Expands the anchored sides to contain the children; the snap path's min floor protects the snapped size.
  const { size: finalSize, position: finalPosition } = applyChildrenBoundsConstraints(
    command.size,
    command.position,
    node.position,
    childrenBounds
  );

  await applySnappingIfNeeded(commandHandler, node, finalPosition, finalSize, true, childrenBounds);
};

/**
 * Handles resizing of a single (non-group) node.
 */
const handleSingleNodeResize = async (commandHandler: CommandHandler, command: ResizeNodeCommand): Promise<void> => {
  const node = commandHandler.flowCore.getNodeById(command.id);
  if (!node) {
    return;
  }

  await applySnappingIfNeeded(commandHandler, node, command.position, command.size, command.disableAutoSize);
};

/**
 * Handles missing initial size in case of dropping from the palette.
 * Note: For bulk initial size updates (e.g., virtualization), prefer using
 * processNodeBatch in FlowResizeBatchProcessorService which batches these updates.
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
  nextSize: Size,
  nextDisableAutoSize: boolean | undefined,
  childrenBounds?: Bounds
) => {
  const flowConfig = commandHandler.flowCore.config;

  if (!flowConfig.snapping.shouldSnapResizeForNode(node)) {
    const { size, position } = applyMinimumSizeConstraints(flowConfig, node, nextSize, nextPosition);
    const updateData: Partial<Node> & { id: Node['id'] } = {
      id: node.id,
      size,
      ...(nextDisableAutoSize !== undefined && { autoSize: !nextDisableAutoSize }),
    };

    if (position) {
      updateData.position = position;
    }

    return await commandHandler.flowCore.applyUpdate(
      {
        nodesToUpdate: [updateData],
      },
      'resizeNode'
    );
  }
  return await computeAndApplySnapping(
    commandHandler,
    node,
    nextPosition,
    nextSize,
    nextDisableAutoSize,
    childrenBounds
  );
};

/** Smallest value of the `offset + n * snap` sequence that is >= `min`, or plain `min` when the axis does not snap. */
const snapCeilToMin = (min: number, step: number, offset: number): number =>
  step ? offset + step * Math.ceil((min - offset) / step) : min;

const computeAndApplySnapping = async (
  commandHandler: CommandHandler,
  node: Node,
  nextPosition: Node['position'] | undefined,
  nextSize: Size,
  nextDisableAutoSize: boolean | undefined,
  childrenBounds?: Bounds
) => {
  const { computeSnapForNodeSize, defaultResizeSnap, computeSnapOffsetForNodeSize, defaultResizeSnapOffset } =
    commandHandler.flowCore.config.snapping;
  const snapping = computeSnapForNodeSize(node) ?? defaultResizeSnap;
  const snapOffset = computeSnapOffsetForNodeSize(node) ?? defaultResizeSnapOffset;
  const fixedRightEdge = Math.round(node.position.x + (node.size?.width ?? 0));
  const fixedBottomEdge = Math.round(node.position.y + (node.size?.height ?? 0));
  const movedX = nextPosition && node.position.x !== nextPosition.x;
  const movedY = nextPosition && node.position.y !== nextPosition.y;

  // Snap only the axes this resize actually moved. Groups get here with a
  // position even for bottom/right resizes (handleGroupNodeResize derives one
  // from the children bounds) — snapping such an untouched axis would shift the node.
  // For a moved axis the grid is phased at `fixedEdge - offset`, so the size
  // derived from it lands on `offset + n * snap` with the opposite edge fixed.
  const snappedPosition = nextPosition
    ? {
        x: movedX
          ? NgDiagramMath.snapNumber(nextPosition.x, snapping.width, fixedRightEdge - snapOffset.width)
          : node.position.x,
        y: movedY
          ? NgDiagramMath.snapNumber(nextPosition.y, snapping.height, fixedBottomEdge - snapOffset.height)
          : node.position.y,
      }
    : undefined;

  // An axis resized from the top/left derives its size from the snapped
  // position, keeping the opposite edge fixed and preventing jittering.
  let finalWidth = nextSize.width;
  let finalHeight = nextSize.height;
  if ((node.size?.width ?? 0) !== finalWidth) {
    finalWidth =
      movedX && snappedPosition
        ? fixedRightEdge - snappedPosition.x
        : NgDiagramMath.snapNumber(finalWidth, snapping.width, snapOffset.width);
  }
  if ((node.size?.height ?? 0) !== finalHeight) {
    finalHeight =
      movedY && snappedPosition
        ? Math.max(fixedBottomEdge - snappedPosition.y, 0)
        : NgDiagramMath.snapNumber(finalHeight, snapping.height, snapOffset.height);
  }

  // A snapped size below the minimum bumps to the smallest valid increment,
  // re-anchoring the fixed edge. For a group the minimum also covers what its
  // children need, so rounding can never cut them. `<= 0` catches a collapse
  // past the fixed edge (min 0 + misaligned offset).
  const minSize = commandHandler.flowCore.config.resize.getMinNodeSize(node);
  const minWidth = Math.max(
    0,
    minSize.width,
    childrenBounds ? (movedX ? fixedRightEdge - childrenBounds.left : childrenBounds.right - node.position.x) : 0
  );
  const minHeight = Math.max(
    0,
    minSize.height,
    childrenBounds ? (movedY ? fixedBottomEdge - childrenBounds.top : childrenBounds.bottom - node.position.y) : 0
  );
  if (finalWidth < minWidth || finalWidth <= 0) {
    finalWidth = snapCeilToMin(minWidth, snapping.width, snapOffset.width);
    if (snappedPosition && movedX) {
      snappedPosition.x = fixedRightEdge - finalWidth;
    }
  }
  if (finalHeight < minHeight || finalHeight <= 0) {
    finalHeight = snapCeilToMin(minHeight, snapping.height, snapOffset.height);
    if (snappedPosition && movedY) {
      snappedPosition.y = fixedBottomEdge - finalHeight;
    }
  }

  const updateData: Partial<Node> & { id: Node['id'] } = {
    id: node.id,
    size: { width: finalWidth, height: finalHeight },
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
