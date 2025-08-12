export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RectWithId extends Rect {
  id: string;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Interface representing a point in the flow diagram
 * @category Types
 */
export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type PortSide = 'top' | 'right' | 'bottom' | 'left';
export type Direction = 'top' | 'bottom' | 'left' | 'right';
export type ContainerEdge =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'topleft'
  | 'topright'
  | 'bottomleft'
  | 'bottomright'
  | null;

export const ROUTING = ['orthogonal', 'straight', 'bezier'] as const;
export type DefaultRouting = (typeof ROUTING)[number];
export type Routing = LooseAutocomplete<DefaultRouting>;

export type PortLocation = {
  side: PortSide;
} & Point;

// More info: https://x.com/mattpocockuk/status/1671908303918473217
export type LooseAutocomplete<T> = T | (string & {});

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (...args: unknown[]) => unknown ? T[P] : T[P] extends object ? DeepPartial<T[P]> : T[P];
};
