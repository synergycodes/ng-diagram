import { Edge, Node, TreeNode } from '../types';

/**
 * Builds a tree structure from list of nodes and edges.
 * Returns an object containing the root nodes and a map of all nodes.
 *
 * @param nodes
 * @param edges
 * @returns {roots, nodeMap }
 *          Object with an array of root nodes and a map of all nodes by ID.
 **/
export const buildTreeStructure = (
  nodes: Pick<Node, 'id' | 'position' | 'size' | 'layoutAngle'>[],
  edges: Pick<Edge, 'source' | 'target'>[]
): {
  roots: TreeNode[];
  nodeMap: Map<string, TreeNode>;
} => {
  const nodeMap = new Map<string, TreeNode>();
  //  Each node is deeply copied and extended with a `children` array.
  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      id: node.id,
      position: { ...node.position },
      size: node.size ? { ...node.size } : undefined,
      children: [],
      layoutAngle: node.layoutAngle,
    });
  });

  //  Each child is added only once, even if multiple edges point to it.
  const addedChildren = new Set<string>();

  edges.forEach((edge) => {
    const parent = nodeMap.get(edge.source);
    const child = nodeMap.get(edge.target);
    if (parent && child && !addedChildren.has(child.id)) {
      parent.children!.push(child);
      addedChildren.add(child.id);
    }
  });

  const roots = Array.from(nodeMap.values()).filter((n) => !edges.some((e) => e.target === n.id));
  return { roots, nodeMap };
};
