/**
 * Represents the calculated transform data for minimap rendering.
 */
export interface MinimapTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Represents a node's visual representation in the minimap.
 */
export interface MinimapNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
}

/**
 * Represents the viewport rectangle in minimap space.
 */
export interface MinimapViewportRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
