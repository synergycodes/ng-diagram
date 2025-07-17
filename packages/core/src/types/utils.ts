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

export const ROUTING = ['orthogonal', 'straight', 'bezier', undefined] as const;
export type DefaultRouting = (typeof ROUTING)[number];
export type Routing = DefaultRouting | string;

export type PortLocation = {
  side: PortSide;
} & Point;
