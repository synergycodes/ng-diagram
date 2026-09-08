export enum NodeTemplateType {
  TreeNode = 'treeNode',
}

export interface TreeNodeData {
  label: string;
  hasChildren?: boolean;
  collapsed?: boolean;
}
