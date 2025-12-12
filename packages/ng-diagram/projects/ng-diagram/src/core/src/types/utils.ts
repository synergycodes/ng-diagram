/**
 * Interface representing size in the flow diagram
 *
 * @public
 * @since 0.8.0
 * @category Types/Geometry
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
 * @public
 * @since 0.8.0
 * @category Types/Geometry
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
 * @public
 * @since 0.8.0
 * @category Types/Model
 */
export type PortSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Interface representing a rect in the flow diagram
 *
 * @public
 * @since 0.8.0
 * @category Types/Geometry
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
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export const DIRECTIONS = ['top', 'bottom', 'left', 'right'] as const;
export type Direction = (typeof DIRECTIONS)[number];

/**
 * Interface representing the location of a port on a node
 *
 * @public
 * @since 0.8.0
 * @category Types/Model
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
