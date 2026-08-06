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

/**
 * Resolves one axis of a snapped resize: snapped position, derived size, and
 * the minimum-size bump. Both axes run the exact same pipeline.
 */
const resolveSnappedAxis = (axis: {
  /** Current node position and size on this axis. */
  position: number;
  size: number;
  /** Requested values; `nextPosition` is undefined when the command has no position. */
  nextPosition: number | undefined;
  nextSize: number;
  step: number;
  offset: number;
  /** Minimum node size on this axis. */
  min: number;
  /** Children bounds projected on this axis (groups only). */
  childrenNear?: number;
  childrenFar?: number;
}): { position: number | undefined; size: number } => {
  const fixedEdge = Math.round(axis.position + axis.size);
  const moved = axis.nextPosition !== undefined && axis.nextPosition !== axis.position;

  // Snap only an axis this resize actually moved — groups get here with a
  // position even for bottom/right resizes (derived from the children bounds),
  // and snapping an untouched axis would shift the node. A moved axis snaps on
  // the grid phased at `fixedEdge - offset`, so the size derived from it lands
  // on `offset + n * step` with the opposite edge fixed.
  let position =
    axis.nextPosition === undefined
      ? undefined
      : moved
        ? NgDiagramMath.snapNumber(axis.nextPosition, axis.step, fixedEdge - axis.offset)
        : axis.position;

  let size = axis.nextSize;
  if (axis.size !== size) {
    size =
      moved && position !== undefined ? fixedEdge - position : NgDiagramMath.snapNumber(size, axis.step, axis.offset);
  }

  // A size below the minimum bumps to the smallest valid increment, re-anchoring
  // the fixed edge. For a group the minimum also covers what the children need,
  // so rounding can never cut them. `<= 0` catches a collapse past the fixed
  // edge (min 0 + misaligned offset).
  const min = Math.max(
    0,
    axis.min,
    axis.childrenNear !== undefined && axis.childrenFar !== undefined
      ? moved
        ? fixedEdge - axis.childrenNear
        : axis.childrenFar - axis.position
      : 0
  );
  if (size < min || size <= 0) {
    size = snapCeilToMin(min, axis.step, axis.offset);
    if (moved && position !== undefined) {
      position = fixedEdge - size;
    }
  }

  return { position, size };
};

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
  const minSize = commandHandler.flowCore.config.resize.getMinNodeSize(node);

  const x = resolveSnappedAxis({
    position: node.position.x,
    size: node.size?.width ?? 0,
    nextPosition: nextPosition?.x,
    nextSize: nextSize.width,
    step: snapping.width,
    offset: snapOffset.width,
    min: minSize.width,
    childrenNear: childrenBounds?.left,
    childrenFar: childrenBounds?.right,
  });
  const y = resolveSnappedAxis({
    position: node.position.y,
    size: node.size?.height ?? 0,
    nextPosition: nextPosition?.y,
    nextSize: nextSize.height,
    step: snapping.height,
    offset: snapOffset.height,
    min: minSize.height,
    childrenNear: childrenBounds?.top,
    childrenFar: childrenBounds?.bottom,
  });

  const updateData: Partial<Node> & { id: Node['id'] } = {
    id: node.id,
    size: { width: x.size, height: y.size },
    ...(nextDisableAutoSize !== undefined && { autoSize: !nextDisableAutoSize }),
  };

  if (x.position !== undefined && y.position !== undefined) {
    updateData.position = { x: x.position, y: y.position };
  }

  await commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: [updateData],
    },
    'resizeNode'
  );
};
