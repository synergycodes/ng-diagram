/**
 * Type for layout angle
 */
export type LayoutAngleType = 0 | 90 | 180 | 270;

/**
 * Type for layout alignment
 */
export type LayoutAlignmentType = 'Parent' | 'Subtree';

export interface TreeLayoutConfig {
  // Configurable gap between sibling nodes in the same row/column
  siblingGap: number;
  // Configurable gap between parent and child nodes
  levelGap: number;
  layoutAngle: LayoutAngleType;
  // Default 'Parent'
  layoutAlignment?: LayoutAlignmentType;
}

export interface TreeNode {
  id: string;
  children: TreeNode[];
  size?: { width: number; height: number };
  position: { x: number; y: number };
  layoutAngle?: LayoutAngleType;
  // Default 'Parent'
  layoutAlignment?: LayoutAlignmentType;
}
