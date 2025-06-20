export interface TreeLayoutConfig {
  // Configurable gap between sibling nodes in the same row/column
  siblingGap: number;
  // Configurable gap between parent and child nodes
  levelGap: number;
  orientation: 'Vertical' | 'Horizontal';
}

export interface TreeNode {
  id: string;
  children: TreeNode[];
  size?: { width: number; height: number };
  position: { x: number; y: number };
}
