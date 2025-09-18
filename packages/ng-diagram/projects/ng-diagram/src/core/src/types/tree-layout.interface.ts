import { Node } from './node.interface';

/**
 * Type for layout angle
 */
export type LayoutAngleType = 0 | 90 | 180 | 270;

/**
 * Type for layout alignment
 */
export type LayoutAlignmentType = 'parent' | 'subtree' | 'start';

export interface TreeNode extends Pick<Node, 'id' | 'position' | 'size' | 'type' | 'groupId'> {
  children: TreeNode[];
  groupChildren?: TreeNode[];
  /**
   * Node layout direction: 0, 90, 180, 270.
   */
  layoutAngle?: LayoutAngleType;
  /**
   * Node layout alignment: 'parent' | 'subtree' | 'start'.
   */
  layoutAlignment?: LayoutAlignmentType;
  isGroup: boolean;
}
