import type { CommandHandler, Edge, Node, Rect } from '../../types';
import { calculatePartsBounds } from '../../utils/dimensions';

export interface ZoomToFitCommand {
  name: 'zoomToFit';
  nodeIds?: string[];
  edgeIds?: string[];
  padding?: number | [number, number] | [number, number, number] | [number, number, number, number];
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

const filterTargetElements = (
  nodes: Node[],
  edges: Edge[],
  nodeIds?: string[],
  edgeIds?: string[]
): { targetNodes: Node[]; targetEdges: Edge[] } => {
  const targetNodes = nodeIds?.length ? nodes.filter((node) => nodeIds.includes(node.id)) : nodes;

  const targetEdges = edgeIds?.length ? edges.filter((edge) => edgeIds.includes(edge.id)) : edges;

  return { targetNodes, targetEdges };
};

const calculateOptimalScale = (
  contentWidth: number,
  contentHeight: number,
  availableWidth: number,
  availableHeight: number,
  minScale: number,
  maxScale: number
): number => {
  const scaleX = availableWidth / contentWidth;
  const scaleY = availableHeight / contentHeight;
  const scale = Math.min(scaleX, scaleY);

  return Math.max(minScale, Math.min(maxScale, scale));
};

const calculateViewportPosition = (
  bounds: Rect,
  viewport: { width: number; height: number },
  padding: Padding,
  scale: number
): { x: number; y: number } => {
  const contentCenterX = bounds.x + bounds.width / 2;
  const contentCenterY = bounds.y + bounds.height / 2;

  const centerOffsetX = (padding.left - padding.right) / 2;
  const centerOffsetY = (padding.top - padding.bottom) / 2;

  return {
    x: viewport.width / 2 - contentCenterX * scale + centerOffsetX,
    y: viewport.height / 2 - contentCenterY * scale + centerOffsetY,
  };
};

const isValidViewport = (viewport: { width?: number; height?: number }): boolean => {
  return !!viewport.width && !!viewport.height && viewport.width > 0 && viewport.height > 0;
};

/**
 * Zoom to fit command handler
 * Calculates optimal viewport position and scale to fit specified content
 */
export const zoomToFit = async (commandHandler: CommandHandler, { nodeIds, edgeIds, padding }: ZoomToFitCommand) => {
  const { nodes, edges, metadata } = commandHandler.flowCore.getState();
  const { viewport } = metadata;

  if (!isValidViewport(viewport)) {
    return;
  }

  const viewportWidth = viewport.width!;
  const viewportHeight = viewport.height!;

  const defaultPadding = commandHandler.flowCore.config.zoom.zoomToFit.padding;
  const effectivePadding = padding ?? defaultPadding;

  const { targetNodes, targetEdges } = filterTargetElements(nodes, edges, nodeIds, edgeIds);
  const bounds = calculatePartsBounds(targetNodes, targetEdges);

  if (!bounds) {
    return;
  }

  const defaultPaddingValue = Array.isArray(defaultPadding) ? defaultPadding[0] : defaultPadding;
  const pad = normalizePadding(effectivePadding, defaultPaddingValue);

  const availableWidth = viewportWidth - pad.left - pad.right;
  const availableHeight = viewportHeight - pad.top - pad.bottom;

  if (availableWidth <= 0 || availableHeight <= 0) {
    return;
  }

  const { min, max } = commandHandler.flowCore.config.zoom;
  const newScale = calculateOptimalScale(bounds.width, bounds.height, availableWidth, availableHeight, min, max);
  const { x: newX, y: newY } = calculateViewportPosition(
    bounds,
    { width: viewportWidth, height: viewportHeight },
    pad,
    newScale
  );

  if (viewport.x === newX && viewport.y === newY && viewport.scale === newScale) {
    return;
  }

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
