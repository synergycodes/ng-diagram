export enum NodeTemplateType {
  TreeNode = 'treeNode',
}

export enum EdgeTemplateType {
  TreeEdge = 'treeEdge',
}

export interface TreeNodeData {
  label: string;
  hasChildren?: boolean;
  collapsed?: boolean;
  isHidden?: boolean;
}

export interface TreeEdgeData {
  isHidden?: boolean;
}
