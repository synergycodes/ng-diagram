import type { Edge } from './edge.interface';
import type { Node } from './node.interface';
import type { TreeLayoutConfig } from './tree-layout.interface.ts';

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
 * Interface representing configurable properties of the rotate handle offset.
 */
export interface RotateHandleConfiguration {
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
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
export interface Metadata<TMiddlewaresMetadata = unknown> {
  viewport: Viewport;
  temporaryEdge?: Edge | null;
  nodeResizeAdornmentConfig?: NodeResizeAdornmentConfig;
  highlightedGroup?: Node['id'] | null;
  layoutConfiguration?: LayoutConfiguration;
  rotateHandleOffset?: RotateHandleConfiguration;
  routingConfiguration?: RoutingConfiguration;
  middlewaresConfig: TMiddlewaresMetadata;
}
