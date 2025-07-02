import { Edge } from './edge.interface';
import { Node } from './node.interface';
import { TreeLayoutConfig } from './tree-layout.interface.ts';

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
 * Interface representing configurable properties of the layouts.
 */
export interface LayoutConfiguration {
  tree?: TreeLayoutConfig;
}

/**
 * Interface representing configurable properties of the routing.
 */
export interface RoutingConfiguration {
  bezier?: {
    bezierControlOffset?: number;
  };
  orthogonal?: {};
  straight?: {};
}

/**
 * Interface representing the metadata of the diagram.
 */
export interface Metadata {
  viewport: Viewport;
  temporaryEdge?: Edge | null;
  nodeResizeAdornmentConfig?: NodeResizeAdornmentConfig;
  highlightedGroup?: Node['id'] | null;
  layoutConfiguration?: LayoutConfiguration;
  routingConfiguration?: RoutingConfiguration;

  [key: string]: unknown;
}
