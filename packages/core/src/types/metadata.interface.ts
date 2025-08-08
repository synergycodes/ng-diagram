import type { Edge } from './edge.interface';
import type { GlobalTreeLayoutConfig } from './tree-layout.interface.ts';

/**
 * Interface representing the viewport of the diagram.
 */
export interface Viewport {
  x: number;
  y: number;
  scale: number;
  width?: number;
  height?: number;
}

/**
 * Interface representing configurable properties of the layouts.
 */
export interface LayoutConfiguration {
  tree?: GlobalTreeLayoutConfig;
}

/**
 * Interface representing configurable properties of the routing.
 */
export interface RoutingConfiguration {
  bezier?: {
    bezierControlOffset?: number;
  };
  orthogonal?: Record<string, unknown>;
  straight?: Record<string, unknown>;
}

/**
 * Interface representing the metadata of the diagram.
 */
export interface Metadata<TMiddlewaresMetadata = unknown> {
  viewport: Viewport;
  temporaryEdge?: Edge | null;
  layoutConfiguration?: LayoutConfiguration;
  routingConfiguration?: RoutingConfiguration;
  middlewaresConfig: TMiddlewaresMetadata;
  [key: string]: unknown;
}
