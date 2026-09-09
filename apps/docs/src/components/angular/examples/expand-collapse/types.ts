export enum NodeTemplateType {
  TreeNode = 'treeNode',
}

export interface TreeNodeData {
  label: string;
  collapsed?: boolean;
}
