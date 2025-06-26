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
  autoLayout?: boolean;
  layoutAngle: LayoutAngleType;
  // Default 'Parent'
  layoutAlignment?: LayoutAlignmentType;
}

export interface TreeNode extends Pick<Node, 'id' | 'position' | 'size' | 'type' | 'groupId'> {
  children: TreeNode[];
  groupChildren?: TreeNode[];
  /**
   * Node layout direction: 0, 90, 180, 270.
   */
  layoutAngle?: LayoutAngleType;
  /**
   * Node layout alignment: 'Parent' | 'Subtree' | 'Start'.
   */
  layoutAlignment?: LayoutAlignmentType;
}
