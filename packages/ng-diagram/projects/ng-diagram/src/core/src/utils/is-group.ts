import { GroupNode, Node } from '../types/node.interface';

export function isGroup(node: Node): node is GroupNode {
  return 'isGroup' in node;
}
