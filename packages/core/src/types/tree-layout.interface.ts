import { Node } from './node.interface.ts';

/**
 * Type for layout angle
 */
export type LayoutAngleType = 0 | 90 | 180 | 270;

/**
 * Type for layout alignment
 */
export type LayoutAlignmentType = 'Parent' | 'Subtree' | 'Start';

export interface TreeLayoutConfig {
  // Configurable gap between sibling nodes in the same row/column
  siblingGap: number;
  // Configurable gap between parent and child nodes
  levelGap: number;
  layoutAngle: LayoutAngleType;
  // Default 'Parent'
  layoutAlignment?: LayoutAlignmentType;
  autoLayout?: boolean;
}

export interface TreeNode extends Pick<Node, 'id' | 'position' | 'size' | 'layoutAngle' | 'type' | 'groupId'> {
  children: TreeNode[];
  groupChildren?: TreeNode[];
}

export type Rect = { minX: number; maxX: number; minY: number; maxY: number };
