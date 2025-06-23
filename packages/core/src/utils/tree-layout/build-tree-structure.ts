import { Edge, Node } from '../../types';
import { TreeNode } from '../../types/tree-layout.interface.ts';

export const buildTopGroupMap = (nodeMap: Map<string, TreeNode>): Map<string, string> => {
  const topGroupMap = new Map<string, string>();

  for (const [id, node] of nodeMap.entries()) {
    let current = node;
    let topGroupId = id;

    while (current.groupId) {
      const parent = nodeMap.get(current.groupId);
      if (!parent || parent.type !== 'group') break;
      topGroupId = parent.id;
      current = parent;
    }

    topGroupMap.set(id, topGroupId);
  }

  return topGroupMap;
};

/**
 * Zwraca top-level grupę dla danego nodeId.
 *
 * @param nodeId - id node'a
 * @param topGroupMap - mapa childId -> topLevelGroupId
 * @returns id top-level grupy lub nodeId jeśli nie jest w grupie
 */
const getTopGroupId = (nodeId: string, topGroupMap: Map<string, string>): string => {
  return topGroupMap.get(nodeId) ?? nodeId;
};

export const remapEdges = (edges: Edge[], topGroupMap: Map<string, string>): { source: string; target: string }[] => {
  return edges.map(({ source, target, ...rest }) => ({
    ...rest,
    source: getTopGroupId(source, topGroupMap),
    target: getTopGroupId(target, topGroupMap),
  }));
};

export const buildGroupsHierarchy = (nodeMap: Map<string, TreeNode>): TreeNode[] => {
  const result: TreeNode[] = [];

  for (const node of nodeMap.values()) {
    if (node.type === 'group') {
      (node as TreeNode).groupChildren = [];
    }
  }

  for (const node of nodeMap.values()) {
    if (node.groupId) {
      const parent = nodeMap.get(node.groupId);
      if (parent?.type === 'group') {
        const groupNode = parent as TreeNode;
        groupNode.groupChildren!.push(node);
      }
    }
  }

  for (const node of nodeMap.values()) {
    if (node.type === 'group' && !node.groupId) {
      result.push(node as TreeNode);
    }
  }

  return result;
};

export const getNodeMap = (nodes: Pick<Node, 'id' | 'position' | 'size' | 'layoutAngle' | 'type' | 'groupId'>[]) => {
  const nodeMap = new Map<string, TreeNode>();
  //  Each node is deeply copied and extended with a `children` array.
  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      id: node.id,
      position: { ...node.position },
      size: node.size ? { ...node.size } : undefined,
      children: [],
      layoutAngle: node.layoutAngle,
      type: node.type,
      groupId: node.groupId,
    });
  });
  return nodeMap;
};
/**
 * Builds a tree structure from list of nodes and edges.
 * Returns an object containing the root nodes and a map of all nodes.
 *
 * @param nodeMap
 * @param edges
 * @returns {roots}
 *          Object with an array of root nodes and a map of all nodes by ID.
 **/
export const buildTreeStructure = (
  nodeMap: Map<string, TreeNode>,
  edges: Pick<Edge, 'source' | 'target'>[]
): {
  roots: TreeNode[];
} => {
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

  const roots = Array.from(nodeMap.values()).filter((n) => !n.groupId && !edges.some((e) => e.target === n.id));

  return { roots };
};
