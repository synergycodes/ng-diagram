import { Node, Rect, unionRect } from '../../../core/src';
import { MinimapNode, MinimapTransform, MinimapViewportRect } from './ng-diagram-minimap.types';

/**
 * Converts viewport position and scale to a bounding rectangle in diagram coordinate space.
 * This represents the visible area of the diagram.
 */
export const convertViewportToDiagramBounds = (viewport: {
  x: number;
  y: number;
  scale: number;
  width?: number;
  height?: number;
}): Rect => {
  const containerWidth = viewport.width ?? 0;
  const containerHeight = viewport.height ?? 0;

  return {
    x: -viewport.x / viewport.scale,
    y: -viewport.y / viewport.scale,
    width: containerWidth / viewport.scale,
    height: containerHeight / viewport.scale,
  };
};

/**
 * Creates a union of diagram content bounds and viewport bounds.
 * This ensures the minimap shows both the diagram content and the current view position.
 */
export const combineDiagramAndViewportBounds = (diagramBounds: Rect, viewportBounds: Rect): Rect => {
  if (viewportBounds.width === 0 || viewportBounds.height === 0) {
    return diagramBounds;
  }
  return unionRect([diagramBounds, viewportBounds]);
};

/**
 * Calculates the scale factor needed to fit bounds within the available minimap space.
 */
const calculateScaleToFitBounds = (
  bounds: Rect,
  minimapWidth: number,
  minimapHeight: number,
  padding: number
): number => {
  const availableWidth = minimapWidth - padding * 2;
  const availableHeight = minimapHeight - padding * 2;

  if (bounds.width === 0 || bounds.height === 0) {
    return 1;
  }

  return Math.min(availableWidth / bounds.width, availableHeight / bounds.height);
};

/**
 * Calculates the X and Y offsets needed to center the scaled content within the minimap.
 */
const calculateCenteringOffset = (
  bounds: Rect,
  minimapWidth: number,
  minimapHeight: number,
  scale: number
): { offsetX: number; offsetY: number } => {
  const scaledWidth = bounds.width * scale;
  const scaledHeight = bounds.height * scale;

  return {
    offsetX: (minimapWidth - scaledWidth) / 2 - bounds.x * scale,
    offsetY: (minimapHeight - scaledHeight) / 2 - bounds.y * scale,
  };
};

/**
 * Computes the complete minimap transform (scale and offset) to fit bounds within minimap dimensions.
 */
export const calculateMinimapTransform = (
  bounds: Rect,
  minimapWidth: number,
  minimapHeight: number,
  padding: number
): MinimapTransform => {
  const scale = calculateScaleToFitBounds(bounds, minimapWidth, minimapHeight, padding);
  const { offsetX, offsetY } = calculateCenteringOffset(bounds, minimapWidth, minimapHeight, scale);
  return { scale, offsetX, offsetY };
};

/**
 * Transforms a diagram node to minimap coordinate space.
 */
export const transformNodeToMinimapSpace = (node: Node, transform: MinimapTransform): MinimapNode => {
  const size = node.size ?? { width: 100, height: 50 };

  return {
    id: node.id,
    x: node.position.x * transform.scale + transform.offsetX,
    y: node.position.y * transform.scale + transform.offsetY,
    width: size.width * transform.scale,
    height: size.height * transform.scale,
    angle: node.angle ?? 0,
  };
};

/**
 * Transforms the viewport rectangle to minimap coordinate space.
 */
export const transformViewportToMinimapSpace = (
  viewport: { x: number; y: number; scale: number; width?: number; height?: number },
  transform: MinimapTransform
): MinimapViewportRect => {
  const containerWidth = viewport.width ?? 0;
  const containerHeight = viewport.height ?? 0;

  const visibleX = -viewport.x / viewport.scale;
  const visibleY = -viewport.y / viewport.scale;
  const visibleWidth = containerWidth / viewport.scale;
  const visibleHeight = containerHeight / viewport.scale;

  return {
    x: visibleX * transform.scale + transform.offsetX,
    y: visibleY * transform.scale + transform.offsetY,
    width: visibleWidth * transform.scale,
    height: visibleHeight * transform.scale,
  };
};
