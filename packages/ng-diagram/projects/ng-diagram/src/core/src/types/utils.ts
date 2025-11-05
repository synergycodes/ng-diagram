/**
 * Interface representing size in the flow diagram
 *
 * @category Types
 */
export interface Size {
  /**
   * Width dimension
   */
  width: number;
  /**
   * Height dimension
   */
  height: number;
}

/**
 * Interface representing a point in the flow diagram
 *
 * @category Types
 */
export interface Point {
  /**
   * X coordinate of the point
   */
  x: number;
  /**
   * Y coordinate of the point
   */
  y: number;
}

/**
 * Interface representing a port side on a node in the diagram
 *
 * @category Types
 */
export type PortSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Interface representing a rect in the flow diagram
 *
 * @category Types
 */
export interface Rect {
  /**
   * X coordinate of the rect's top-left corner
   */
  x: number;
  /**
   * Y coordinate of the rect's top-left corner
   */
  y: number;
  /**
   * Width dimension
   */
  width: number;
  /**
   * Height dimension
   */
  height: number;
}

export interface RectWithId extends Rect {
  id: string;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type Direction = 'top' | 'bottom' | 'left' | 'right';

/**
 * Interface representing the location of a port on a node
 *
 * @category Types
 */
export type PortLocation = {
  side: PortSide;
} & Point;

export type DataObject = object;

// More info: https://x.com/mattpocockuk/status/1671908303918473217
/**
 * @ignore
 */
export type LooseAutocomplete<T> = T | (string & {});

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (...args: unknown[]) => unknown ? T[P] : T[P] extends object ? DeepPartial<T[P]> : T[P];
};
