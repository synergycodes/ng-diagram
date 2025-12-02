import { DataObject } from './utils';

/**
 * Interface representing the viewport of the diagram.
 *
 * @category Types/Model
 */
export interface Viewport {
  /** X coordinate of the viewport center */
  x: number;
  /** Y coordinate of the viewport center */
  y: number;
  /** Scale factor of the viewport */
  scale: number;
  /** Width of the viewport */
  width?: number;
  /** Height of the viewport */
  height?: number;
  /** TEST PROPERTY - REMOVE AFTER TESTING */
  testApiChange?: string;
}

/**
 * Interface representing the metadata of the diagram.
 *
 * @category Types/Model
 */
export interface Metadata<T extends DataObject = DataObject> {
  /**
   * Viewport of the diagram
   */
  viewport: Viewport;

  /**
   * Custom user data associated with the diagram
   */
  data?: T;
}
