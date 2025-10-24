import type { CommandHandler, Edge, Node } from '../../types';

export interface ZoomToFitCommand {
  name: 'zoomToFit';
  nodeIds?: string[];
  edgeIds?: string[];
  padding?: number | [number, number] | [number, number, number] | [number, number, number, number];
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Normalizes padding input to individual values (CSS-like)
 * - Single number: applies to all sides
 * - [v, h]: vertical, horizontal
 * - [t, h, b]: top, horizontal, bottom
 * - [t, r, b, l]: top, right, bottom, left
 */
const normalizePadding = (padding: number | number[], defaultPadding: number): Padding => {
  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }

  switch (padding.length) {
    case 2:
      return { top: padding[0], right: padding[1], bottom: padding[0], left: padding[1] };
    case 3:
      return { top: padding[0], right: padding[1], bottom: padding[2], left: padding[1] };
    case 4:
      return { top: padding[0], right: padding[1], bottom: padding[2], left: padding[3] };
    default:
      return { top: defaultPadding, right: defaultPadding, bottom: defaultPadding, left: defaultPadding };
  }
};

/**
 * Calculates the bounding box for a set of nodes and edges in a single pass
 * Returns null if validation fails or bounds cannot be calculated
 */
const calculateBounds = (nodes: Node[], edges: Edge[]): Bounds | null => {
  if (nodes.length === 0 && edges.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Process nodes - validate that all nodes have size
  for (const node of nodes) {
    const { position, size } = node;

    if (!size || size.width == null || size.height == null) {
      console.warn(`zoomToFit: Node "${node.id}" is missing size. All nodes must have size defined.`);
      return null;
    }

    const x1 = position.x;
    const y1 = position.y;
    const x2 = x1 + size.width;
    const y2 = y1 + size.height;

    if (x1 < minX) minX = x1;
    if (y1 < minY) minY = y1;
    if (x2 > maxX) maxX = x2;
    if (y2 > maxY) maxY = y2;
  }

  // Process edges - validate that all edges have points
  for (const edge of edges) {
    if (!edge.points || edge.points.length === 0) {
      console.warn(`zoomToFit: Edge "${edge.id}" is missing points. All edges must have points defined.`);
      return null;
    }

    // Process all points
    for (const { x, y } of edge.points) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
};

/**
 * Zoom to fit command handler
 * Calculates optimal viewport position and scale to fit specified content
 */
export const zoomToFit = async (commandHandler: CommandHandler, { nodeIds, edgeIds, padding }: ZoomToFitCommand) => {
  const { nodes, edges, metadata } = commandHandler.flowCore.getState();
  const { viewport } = metadata;

  // Get default padding from config
  const defaultPadding = commandHandler.flowCore.config.zoomToFit.padding;
  const effectivePadding = padding ?? defaultPadding;

  // Validate viewport dimensions
  if (!viewport.width || !viewport.height || viewport.width <= 0 || viewport.height <= 0) {
    return;
  }

  // Filter nodes and edges based on provided IDs (only if IDs are specified)
  let targetNodes = nodes;
  let targetEdges = edges;

  if (nodeIds && nodeIds.length > 0) {
    const nodeIdSet = new Set(nodeIds);
    targetNodes = nodes.filter((node) => nodeIdSet.has(node.id));
  }

  if (edgeIds && edgeIds.length > 0) {
    const edgeIdSet = new Set(edgeIds);
    targetEdges = edges.filter((edge) => edgeIdSet.has(edge.id));
  }

  // Calculate combined bounding box in a single pass
  const bounds = calculateBounds(targetNodes, targetEdges);

  // Handle empty content
  if (!bounds) {
    return;
  }

  const { minX, minY, maxX, maxY } = bounds;
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  if (contentWidth <= 0 || contentHeight <= 0) {
    return;
  }

  // Normalize padding to individual values
  // Convert default padding to the same format as command padding for normalizePadding function
  const defaultPaddingValue = Array.isArray(defaultPadding) ? defaultPadding[0] : defaultPadding;
  const pad = normalizePadding(effectivePadding, defaultPaddingValue);

  // Apply padding to available viewport space
  const availableWidth = viewport.width - pad.left - pad.right;
  const availableHeight = viewport.height - pad.top - pad.bottom;

  if (availableWidth <= 0 || availableHeight <= 0) {
    return;
  }

  // Calculate scale to fit content within available space
  const scaleX = availableWidth / contentWidth;
  const scaleY = availableHeight / contentHeight;
  let newScale = Math.min(scaleX, scaleY);

  // Clamp scale to zoom constraints
  const { min, max } = commandHandler.flowCore.config.zoom;
  if (newScale < min) {
    newScale = min;
  } else if (newScale > max) {
    newScale = max;
  }

  // Calculate content center
  const contentCenterX = minX + contentWidth / 2;
  const contentCenterY = minY + contentHeight / 2;

  // Calculate viewport position to center the content with asymmetric padding
  const centerOffsetX = (pad.left - pad.right) / 2;
  const centerOffsetY = (pad.top - pad.bottom) / 2;
  const newX = viewport.width / 2 - contentCenterX * newScale + centerOffsetX;
  const newY = viewport.height / 2 - contentCenterY * newScale + centerOffsetY;

  // Check if viewport needs updating
  if (viewport.x === newX && viewport.y === newY && viewport.scale === newScale) {
    return;
  }

  // Apply the update
  await commandHandler.flowCore.applyUpdate(
    {
      metadataUpdate: {
        viewport: {
          ...viewport,
          x: newX,
          y: newY,
          scale: newScale,
        },
      },
    },
    'zoomToFit'
  );
};
