import { LayoutAlignmentType, LayoutAngleType } from './tree-layout.interface.ts';

export interface LayoutConfiguration {
  tree?: {
    /**
     * Node layout direction: 0, 90, 180, 270.
     */
    layoutAngle?: LayoutAngleType;
    /**
     * Node layout alignment: 'Parent' | 'Subtree' | 'Start'.
     */
    layoutAlignment?: LayoutAlignmentType;
  };
}
