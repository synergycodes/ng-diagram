import { describe, expect, it } from 'vitest';
import { mockNode } from '../../test-utils';
import type { Node } from '../../types';
import { getNodesWithChildren } from './get-nodes-with-children';

function buildNodesMap(...nodes: Node[]): Map<string, Node> {
  return new Map(nodes.map((n) => [n.id, n]));
}

describe('getNodesWithChildren', () => {
  it('should return the specified node', () => {
    const node: Node = { ...mockNode, id: 'node1' };
    const nodesMap = buildNodesMap(node);

    const result = getNodesWithChildren(['node1'], nodesMap);

    expect(result).toEqual([node]);
  });

  it('should return multiple specified nodes', () => {
    const node1: Node = { ...mockNode, id: 'node1' };
    const node2: Node = { ...mockNode, id: 'node2' };
    const nodesMap = buildNodesMap(node1, node2);

    const result = getNodesWithChildren(['node1', 'node2'], nodesMap);

    expect(result).toEqual([node1, node2]);
  });

  it('should return empty array when no nodeIds are provided', () => {
    const node: Node = { ...mockNode, id: 'node1' };
    const nodesMap = buildNodesMap(node);

    const result = getNodesWithChildren([], nodesMap);

    expect(result).toEqual([]);
  });

  it('should skip non-existent node IDs', () => {
    const node: Node = { ...mockNode, id: 'node1' };
    const nodesMap = buildNodesMap(node);

    const result = getNodesWithChildren(['node1', 'nonexistent'], nodesMap);

    expect(result).toEqual([node]);
  });

  it('should return empty array when all nodeIds are non-existent', () => {
    const nodesMap = buildNodesMap();

    const result = getNodesWithChildren(['nonexistent'], nodesMap);

    expect(result).toEqual([]);
  });

  describe('children resolution', () => {
    it('should include direct children of a specified node', () => {
      const parent: Node = { ...mockNode, id: 'parent' };
      const child: Node = { ...mockNode, id: 'child', groupId: 'parent' };
      const nodesMap = buildNodesMap(parent, child);

      const result = getNodesWithChildren(['parent'], nodesMap);

      expect(result).toEqual([parent, child]);
    });

    it('should include deeply nested descendants', () => {
      const root: Node = { ...mockNode, id: 'root' };
      const child: Node = { ...mockNode, id: 'child', groupId: 'root' };
      const grandchild: Node = { ...mockNode, id: 'grandchild', groupId: 'child' };
      const nodesMap = buildNodesMap(root, child, grandchild);

      const result = getNodesWithChildren(['root'], nodesMap);

      expect(result).toEqual([root, child, grandchild]);
    });

    it('should include multiple children of a single parent', () => {
      const parent: Node = { ...mockNode, id: 'parent' };
      const child1: Node = { ...mockNode, id: 'child1', groupId: 'parent' };
      const child2: Node = { ...mockNode, id: 'child2', groupId: 'parent' };
      const nodesMap = buildNodesMap(parent, child1, child2);

      const result = getNodesWithChildren(['parent'], nodesMap);

      expect(result).toEqual([parent, child1, child2]);
    });

    it('should not include children of nodes that are not specified', () => {
      const node1: Node = { ...mockNode, id: 'node1' };
      const node2: Node = { ...mockNode, id: 'node2' };
      const child: Node = { ...mockNode, id: 'child', groupId: 'node2' };
      const nodesMap = buildNodesMap(node1, node2, child);

      const result = getNodesWithChildren(['node1'], nodesMap);

      expect(result).toEqual([node1]);
    });
  });

  describe('deduplication', () => {
    it('should not duplicate when the same nodeId is passed twice', () => {
      const node: Node = { ...mockNode, id: 'node1' };
      const nodesMap = buildNodesMap(node);

      const result = getNodesWithChildren(['node1', 'node1'], nodesMap);

      expect(result).toEqual([node]);
    });

    it('should not duplicate when a child is also explicitly specified', () => {
      const parent: Node = { ...mockNode, id: 'parent' };
      const child: Node = { ...mockNode, id: 'child', groupId: 'parent' };
      const nodesMap = buildNodesMap(parent, child);

      const result = getNodesWithChildren(['parent', 'child'], nodesMap);

      expect(result).toEqual([parent, child]);
    });

    it('should not duplicate when two specified nodes share a descendant', () => {
      const group1: Node = { ...mockNode, id: 'group1' };
      const group2: Node = { ...mockNode, id: 'group2', groupId: 'group1' };
      const child: Node = { ...mockNode, id: 'child', groupId: 'group2' };
      const nodesMap = buildNodesMap(group1, group2, child);

      const result = getNodesWithChildren(['group1', 'group2'], nodesMap);

      expect(result).toEqual([group1, group2, child]);
    });
  });
});
