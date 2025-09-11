import type { Edge } from './edge.interface';

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
 * Interface representing the metadata of the diagram.
 */
export interface Metadata<TMiddlewaresMetadata = unknown> {
  viewport: Viewport;
  temporaryEdge?: Edge | null;
  middlewaresConfig: TMiddlewaresMetadata;
  [key: string]: unknown;
}
