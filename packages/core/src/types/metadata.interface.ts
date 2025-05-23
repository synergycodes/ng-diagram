import { Edge } from './edge.interface';

/**
 * Interface representing the viewport of the diagram.
 */
export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

/**
 * Interface representing configurable properties of the node resize adornment.
 */
export interface NodeResizeAdornmentConfig {
  color?: string;
  strokeWidth?: number;
  handleSize?: number;
  handleBackgroundColor?: string;
}

/**
 * Interface representing the metadata of the diagram.
 */
export interface Metadata {
  viewport: Viewport;
  temporaryEdge?: Edge | null;
  nodeResizeAdornmentConfig?: NodeResizeAdornmentConfig;
  [key: string]: unknown;
}
