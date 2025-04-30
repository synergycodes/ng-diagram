export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface Metadata {
  viewport: Viewport;
  [key: string]: unknown;
}
