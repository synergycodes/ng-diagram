import { DataObject } from './utils';

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
export interface Metadata<T extends DataObject = DataObject> {
  viewport: Viewport;
  data?: T;
}
