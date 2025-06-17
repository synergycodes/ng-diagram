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

export interface TreeLayoutConfig {
  // Configurable gap between sibling nodes in the same row/column
  siblingGap: number;
  // Configurable gap between parent and child nodes
  levelGap: number;
  layoutAngle: 0 | 90 | 180 | 270;
  // Default 'Parent'
  layoutAlignment?: 'Parent' | 'Subtree';
}

export interface TreeNode {
  id: string;
  children: TreeNode[];
  size?: { width: number; height: number };
  position: { x: number; y: number };
  layoutAngle?: 0 | 90 | 180 | 270;
  // Default 'Parent'
  layoutAlignment?: 'Parent' | 'Subtree';
}
