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
 *
 * Built-in routing configurations:
 * - `bezier`: Configuration for bezier curve routing
 * - `orthogonal`: Configuration for orthogonal (right-angled) routing
 *
 * Custom routing configurations can be added using any other string key.
 * The `polyline` routing doesn't require any configuration.
 */
export interface RoutingConfiguration {
  bezier?: {
    bezierControlOffset?: number;
  };
  orthogonal?: {
    firstLastSegmentLength?: number;
    maxCornerRadius?: number;
  };

  /**
   * Allow custom routing configurations.
   * Users can add their own routing config with any key except the built-in ones.
   */
  [routingName: string]: Record<string, unknown> | undefined;
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
