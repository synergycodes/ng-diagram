import { Edge, GroupNode, Node, TreeLayoutConfig, TreeNode } from '../../../../types';
import { isGroup } from '../../../../utils';

/**
 * Makes a map that shows, for each node, the top group it belongs to.
 *
 * @param nodeMap - Map of all tree nodes, with node ID as the key.
 * @returns Map where each key is a node ID, and the value is its top group ID
 */
export const buildTopGroupMap = (nodeMap: Map<string, TreeNode>): Map<string, string> => {
  const topGroupMap = new Map<string, string>();

  for (const [id, node] of nodeMap) {
    let topId = id;
    let parent = nodeMap.get(node.groupId ?? '');

    // Go up the tree to find the top group
    while (parent?.isGroup) {
      topId = parent.id;
      parent = nodeMap.get(parent.groupId ?? '');
    }

    topGroupMap.set(id, topId);
  }

  return topGroupMap;
};

/**
 * Returns the top-level group for a given nodeId.
 *
 * @param nodeId
 * @param topGroupMap - a map of childId -> topLevelGroupId
 * @returns the id of the top-level group or nodeId if it is not in a group
 */
const getTopGroupId = (nodeId: string, topGroupMap: Map<string, string>): string => {
  return topGroupMap.get(nodeId) ?? nodeId;
};

/**
 * Updates edges so source and target are top group IDs.
 *
 * @param edges - List of edges with source and target IDs.
 * @param topGroupMap - Map from node ID to top group ID.
 * @returns new list of edges with an updated source and target.
 */
export const remapEdges = (edges: Edge[], topGroupMap: Map<string, string>): { source: string; target: string }[] =>
  edges.map((edge) => ({
    ...edge,
    source: getTopGroupId(edge.source, topGroupMap),
    target: getTopGroupId(edge.target, topGroupMap),
  }));

export const buildGroupsHierarchy = (nodeMap: Map<string, TreeNode>): TreeNode[] => {
  const result: TreeNode[] = [];

  for (const node of nodeMap.values()) {
    if (node.isGroup) {
      (node as TreeNode).groupChildren = [];
    }
  }

  for (const node of nodeMap.values()) {
    if (node.groupId) {
      const parent = nodeMap.get(node.groupId);
      if (parent?.isGroup) {
        const groupNode = parent as TreeNode;
        groupNode.groupChildren!.push(node);
      }
    }
    if (node.isGroup && node.groupId == null) {
      result.push(node as TreeNode);
    }
  }

  return result;
};

export const getNodeMap = (config: TreeLayoutConfig, nodes: (Node | GroupNode)[]) => {
  const nodeMap = new Map<string, TreeNode>();
  //  Each node is deeply copied and extended with a `children` array.
  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      id: node.id,
      position: { ...node.position },
      size: node.size ? { ...node.size } : undefined,
      children: [],
      layoutAngle: config.getLayoutAngleForNode(node) ?? undefined,
      layoutAlignment: config.getLayoutAlignmentForNode(node) ?? undefined,
      type: node.type,
      groupId: node.groupId,
      isGroup: isGroup(node),
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
 * @returns {roots} Object with an array of root nodes and a map of all nodes by ID.
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
      parent.children.push(child);
      addedChildren.add(child.id);
    }
  });

  const roots = Array.from(nodeMap.values()).filter((n) => n.groupId == null && !edges.some((e) => e.target === n.id));

  return { roots };
};
