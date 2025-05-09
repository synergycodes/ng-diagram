import { Edge } from './edge.interface';

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface Metadata {
  viewport: Viewport;
  temporaryEdge?: Edge | null;
  [key: string]: unknown;
}
