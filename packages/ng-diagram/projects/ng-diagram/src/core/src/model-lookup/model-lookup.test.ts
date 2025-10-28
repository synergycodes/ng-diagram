import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../flow-core';
import type { Edge, Node } from '../types';
import { ModelLookup } from './model-lookup';

describe('ModelLookup', () => {
  let modelLookup: ModelLookup;
  let mockFlowCore: FlowCore;
  let mockNodes: Node[];
  let mockEdges: Edge[];

  beforeEach(() => {
    mockNodes = [
      {
        id: 'node1',
        type: 'default',
        position: { x: 0, y: 0 },
        data: {},
      },
      {
        id: 'node2',
        type: 'default',
        position: { x: 100, y: 100 },
        data: {},
        groupId: 'node1',
      },
      {
        id: 'node3',
        type: 'default',
        position: { x: 200, y: 200 },
        data: {},
        groupId: 'node2',
      },
      {
        id: 'node4',
        type: 'default',
        position: { x: 300, y: 300 },
        data: {},
      },
    ];

    mockEdges = [
      {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 100, y: 100 },
        data: {},
      },
      {
        id: 'edge2',
        source: 'node2',
        target: 'node3',
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 },
        data: {},
      },
    ];

    mockFlowCore = {
      model: {
        getNodes: vi.fn().mockReturnValue(mockNodes),
        getEdges: vi.fn().mockReturnValue(mockEdges),
      },
      getState: vi.fn().mockReturnValue({
        nodes: mockNodes,
        edges: mockEdges,
        metadata: {},
      }),
    } as unknown as FlowCore;

    modelLookup = new ModelLookup(mockFlowCore);
  });

  describe('constructor', () => {
    it('should initialize with correct maps', () => {
      expect(modelLookup.nodesMap.size).toBe(4);
      expect(modelLookup.edgesMap.size).toBe(2);
      expect(modelLookup.directChildrenMap.size).toBe(2);
    });

    it('should build correct direct children map', () => {
      expect(modelLookup.directChildrenMap.get('node1')).toEqual(['node2']);
      expect(modelLookup.directChildrenMap.get('node2')).toEqual(['node3']);
    });
  });

  describe('synchronization', () => {
    it('should synchronize the model lookup', () => {
      const nodes1 = [mockNodes[0], mockNodes[1]];
      const edges1 = [mockEdges[0]];
      (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: nodes1,
        edges: edges1,
        metadata: {},
      });

      const nodesSize1 = modelLookup.nodesMap.size;
      const edgesSize1 = modelLookup.edgesMap.size;

      modelLookup.desynchronize();

      const nodes2 = [mockNodes[0], mockNodes[1], mockNodes[2]];
      const edges2 = [mockEdges[0], mockEdges[1]];
      (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: nodes2,
        edges: edges2,
        metadata: {},
      });

      const nodesSize2 = modelLookup.nodesMap.size;
      const edgesSize2 = modelLookup.edgesMap.size;

      expect(nodesSize1).toBe(2);
      expect(edgesSize1).toBe(1);
      expect(nodesSize2).toBe(3);
      expect(edgesSize2).toBe(2);
    });
  });

  describe('getNodeById', () => {
    it('should return node by id', () => {
      const node = modelLookup.getNodeById('node1');
      expect(node).toEqual(mockNodes[0]);
    });

    it('should return null for non-existent node', () => {
      const node = modelLookup.getNodeById('nonExistent');
      expect(node).toBeNull();
    });
  });

  describe('getEdgeById', () => {
    it('should return edge by id', () => {
      const edge = modelLookup.getEdgeById('edge1');
      expect(edge).toEqual(mockEdges[0]);
    });

    it('should return null for non-existent edge', () => {
      const edge = modelLookup.getEdgeById('nonExistent');
      expect(edge).toBeNull();
    });
  });

  describe('getChildrenIds', () => {
    it('should return direct children ids for a group', () => {
      const children = modelLookup.getNodeChildrenIds('node1');
      expect(children).toEqual(['node2']);
    });

    it('should return empty array for non-group node', () => {
      const children = modelLookup.getNodeChildrenIds('node4');

      expect(children).toEqual([]);
    });
  });

  describe('hasChildren', () => {
    it('should return true for node with children', () => {
      expect(modelLookup.hasChildren('node1')).toBe(true);
    });

    it('should return false for node without children', () => {
      expect(modelLookup.hasChildren('node4')).toBe(false);
    });
  });

  describe('hasDescendants', () => {
    it('should return true for node with descendants', () => {
      expect(modelLookup.hasDescendants('node1')).toBe(true);
    });

    it('should return false for node without descendants', () => {
      expect(modelLookup.hasDescendants('node4')).toBe(false);
    });
  });

  describe('getNodeChildren', () => {
    it('should return direct children when directOnly is true', () => {
      const children = modelLookup.getNodeChildren('node1', { directOnly: true });
      expect(children).toHaveLength(1);
      expect(children[0].id).toBe('node2');
    });

    it('should return all descendants when directOnly is false', () => {
      const children = modelLookup.getNodeChildren('node1', { directOnly: false });
      expect(children).toHaveLength(2);
      expect(children.map((n) => n.id)).toEqual(['node2', 'node3']);
    });
  });

  describe('getSelectedNodes', () => {
    it('should return selected nodes', () => {
      const selectedNodes = [
        { ...mockNodes[0], selected: true },
        { ...mockNodes[1], selected: true },
      ];
      (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: selectedNodes,
        edges: mockEdges,
        metadata: {},
      });

      const result = modelLookup.getSelectedNodes();
      expect(result).toHaveLength(2);
      expect(result.every((node) => node.selected)).toBe(true);
    });

    it('should return empty array when no nodes are selected', () => {
      const result = modelLookup.getSelectedNodes();
      expect(result).toHaveLength(0);
    });
  });

  describe('getSelectedNodesWithChildren', () => {
    it('should return selected nodes with their direct children', () => {
      const selectedNodes = [
        { ...mockNodes[0], selected: true },
        { ...mockNodes[1], selected: false },
      ];
      (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: selectedNodes,
        edges: mockEdges,
        metadata: {},
      });

      const result = modelLookup.getSelectedNodesWithChildren({ directOnly: true });
      expect(result).toHaveLength(2); // Selected node + its direct child
    });

    it('should return selected nodes with all descendants', () => {
      const selectedNodes = [
        { ...mockNodes[0], selected: true },
        { ...mockNodes[1], selected: false },
        { ...mockNodes[2], selected: false },
      ];
      (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: selectedNodes,
        edges: mockEdges,
        metadata: {},
      });

      const result = modelLookup.getSelectedNodesWithChildren({ directOnly: false });
      expect(result).toHaveLength(3); // Selected node + all descendants
    });

    it('should return selected nodes with all descendants without duplicates', () => {
      const selectedNodes = [
        { ...mockNodes[0], selected: true },
        { ...mockNodes[1], selected: true },
        { ...mockNodes[2], selected: false },
      ];
      (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: selectedNodes,
        edges: mockEdges,
        metadata: {},
      });

      const result = modelLookup.getSelectedNodesWithChildren({ directOnly: false });
      expect(result).toHaveLength(3); // Selected node + all descendants
    });
  });

  describe('getSelectedEdges', () => {
    it('should return selected edges', () => {
      const selectedEdges = [
        { ...mockEdges[0], selected: true },
        { ...mockEdges[1], selected: true },
      ];
      (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: mockNodes,
        edges: selectedEdges,
        metadata: {},
      });

      const result = modelLookup.getSelectedEdges();
      expect(result).toHaveLength(2);
      expect(result.every((edge) => edge.selected)).toBe(true);
    });

    it('should return empty array when no edges are selected', () => {
      const result = modelLookup.getSelectedEdges();
      expect(result).toHaveLength(0);
    });
  });

  describe('isNodeDescendantOfGroup', () => {
    it('should return true for direct child', () => {
      expect(modelLookup.isNodeDescendantOfGroup('node2', 'node1')).toBe(true);
    });

    it('should return true for indirect descendant', () => {
      expect(modelLookup.isNodeDescendantOfGroup('node3', 'node1')).toBe(true);
    });

    it('should return false for non-descendant', () => {
      expect(modelLookup.isNodeDescendantOfGroup('node4', 'node1')).toBe(false);
    });

    it('should return false for same node', () => {
      expect(modelLookup.isNodeDescendantOfGroup('node1', 'node1')).toBe(false);
    });
  });

  describe('getConnectedEdges', () => {
    it('should return all edges connected to a node as source', () => {
      const edges = modelLookup.getConnectedEdges('node1');
      expect(edges).toHaveLength(1);
      expect(edges[0].id).toBe('edge1');
    });

    it('should return all edges connected to a node as target', () => {
      const edges = modelLookup.getConnectedEdges('node3');
      expect(edges).toHaveLength(1);
      expect(edges[0].id).toBe('edge2');
    });

    it('should return edges connected to a node as both source and target', () => {
      const edges = modelLookup.getConnectedEdges('node2');
      expect(edges).toHaveLength(2);
      expect(edges.map((e) => e.id)).toContain('edge1');
      expect(edges.map((e) => e.id)).toContain('edge2');
    });

    it('should return empty array for node with no connected edges', () => {
      const edges = modelLookup.getConnectedEdges('node4');
      expect(edges).toEqual([]);
    });

    it('should return empty array for non-existent node', () => {
      const edges = modelLookup.getConnectedEdges('nonExistent');
      expect(edges).toEqual([]);
    });

    it('should synchronize connectedEdgesMap when desynchronized', () => {
      const newEdges = [
        ...mockEdges,
        {
          id: 'edge3',
          source: 'node4',
          target: 'node1',
          sourcePosition: { x: 300, y: 300 },
          targetPosition: { x: 0, y: 0 },
          data: {},
        },
      ];

      (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: mockNodes,
        edges: newEdges,
        metadata: {},
      });

      modelLookup.desynchronize();
      const edges = modelLookup.getConnectedEdges('node4');
      expect(edges).toHaveLength(1);
      expect(edges[0].id).toBe('edge3');
    });
  });

  describe('getConnectedNodes', () => {
    it('should return all nodes connected to a given node', () => {
      const nodes = modelLookup.getConnectedNodes('node2');
      expect(nodes).toHaveLength(2);
      expect(nodes.map((n) => n.id)).toContain('node1');
      expect(nodes.map((n) => n.id)).toContain('node3');
    });

    it('should return single connected node', () => {
      const nodes = modelLookup.getConnectedNodes('node1');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('node2');
    });

    it('should return empty array for node with no connections', () => {
      const nodes = modelLookup.getConnectedNodes('node4');
      expect(nodes).toEqual([]);
    });

    it('should return empty array for non-existent node', () => {
      const nodes = modelLookup.getConnectedNodes('nonExistent');
      expect(nodes).toEqual([]);
    });

    it('should not return duplicate nodes when multiple edges connect to same node', () => {
      const edgesWithDuplicates = [
        ...mockEdges,
        {
          id: 'edge3',
          source: 'node1',
          target: 'node2',
          sourcePosition: { x: 0, y: 0 },
          targetPosition: { x: 100, y: 100 },
          data: {},
        },
      ];

      (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: mockNodes,
        edges: edgesWithDuplicates,
        metadata: {},
      });

      modelLookup.desynchronize();
      const nodes = modelLookup.getConnectedNodes('node1');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('node2');
    });

    it('should handle self-loops', () => {
      const edgesWithSelfLoop = [
        ...mockEdges,
        {
          id: 'edge3',
          source: 'node1',
          target: 'node1',
          sourcePosition: { x: 0, y: 0 },
          targetPosition: { x: 0, y: 0 },
          data: {},
        },
      ];

      (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: mockNodes,
        edges: edgesWithSelfLoop,
        metadata: {},
      });

      modelLookup.desynchronize();
      const nodes = modelLookup.getConnectedNodes('node1');
      expect(nodes.map((n) => n.id)).toContain('node1');
      expect(nodes.map((n) => n.id)).toContain('node2');
    });
  });

  describe('getNodeEnds', () => {
    it('should return source and target nodes for an edge', () => {
      const result = modelLookup.getNodeEnds('edge1');
      expect(result).not.toBeNull();
      expect(result?.source.id).toBe('node1');
      expect(result?.target.id).toBe('node2');
    });

    it('should return null for non-existent edge', () => {
      const result = modelLookup.getNodeEnds('nonExistent');
      expect(result).toBeNull();
    });

    it('should return null when source node does not exist', () => {
      const edgeWithMissingSource: Edge[] = [
        {
          id: 'edge3',
          source: 'nonExistent',
          target: 'node1',
          sourcePosition: { x: 0, y: 0 },
          targetPosition: { x: 0, y: 0 },
          data: {},
        },
      ];

      (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: mockNodes,
        edges: edgeWithMissingSource,
        metadata: {},
      });

      modelLookup.desynchronize();
      const result = modelLookup.getNodeEnds('edge3');
      expect(result).toBeNull();
    });

    it('should return null when target node does not exist', () => {
      const edgeWithMissingTarget: Edge[] = [
        {
          id: 'edge3',
          source: 'node1',
          target: 'nonExistent',
          sourcePosition: { x: 0, y: 0 },
          targetPosition: { x: 0, y: 0 },
          data: {},
        },
      ];

      (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: mockNodes,
        edges: edgeWithMissingTarget,
        metadata: {},
      });

      modelLookup.desynchronize();
      const result = modelLookup.getNodeEnds('edge3');
      expect(result).toBeNull();
    });

    it('should handle self-loop edges', () => {
      const edgesWithSelfLoop = [
        {
          id: 'edge3',
          source: 'node1',
          target: 'node1',
          sourcePosition: { x: 0, y: 0 },
          targetPosition: { x: 0, y: 0 },
          data: {},
        },
      ];

      (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: mockNodes,
        edges: edgesWithSelfLoop,
        metadata: {},
      });

      modelLookup.desynchronize();
      const result = modelLookup.getNodeEnds('edge3');
      expect(result).not.toBeNull();
      expect(result?.source.id).toBe('node1');
      expect(result?.target.id).toBe('node1');
    });
  });

  describe('wouldCreateCircularDependency', () => {
    it('should return true when node and group are the same', () => {
      expect(modelLookup.wouldCreateCircularDependency('node1', 'node1')).toBe(true);
    });

    it('should return true when group is a descendant of node', () => {
      // node2 is a child of node1, so making node1 a child of node2 would create a cycle
      expect(modelLookup.wouldCreateCircularDependency('node1', 'node2')).toBe(true);
    });

    it('should return true for multi-level circular dependency', () => {
      // node3 is a grandchild of node1, so making node1 a child of node3 would create a cycle
      expect(modelLookup.wouldCreateCircularDependency('node1', 'node3')).toBe(true);
    });

    it('should return false when no circular dependency would be created', () => {
      // node4 has no relationship with node1
      expect(modelLookup.wouldCreateCircularDependency('node4', 'node1')).toBe(false);
    });

    it('should return false for valid parent-child relationship', () => {
      // node2 is already a child of node1, so making node3 a child of node1 is fine
      expect(modelLookup.wouldCreateCircularDependency('node2', 'node1')).toBe(false);
    });
  });

  describe('getParentChain', () => {
    it('should return empty array for node without parent', () => {
      const chain = modelLookup.getParentChain('node1');
      expect(chain).toEqual([]);
    });

    it('should return single parent for direct child', () => {
      const nodesWithGroup = [
        {
          id: 'group1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: {},
          isGroup: true,
          highlighted: false,
        },
        {
          id: 'node1',
          type: 'default',
          position: { x: 100, y: 100 },
          data: {},
          groupId: 'group1',
        },
      ];

      (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: nodesWithGroup,
        edges: [],
        metadata: {},
      });

      modelLookup.desynchronize();
      const chain = modelLookup.getParentChain('node1');
      expect(chain).toHaveLength(1);
      expect(chain[0].id).toBe('group1');
    });

    it('should return full parent chain for deeply nested node', () => {
      const nodesWithNestedGroups = [
        {
          id: 'group1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: {},
          isGroup: true,
          highlighted: false,
        },
        {
          id: 'group2',
          type: 'default',
          position: { x: 50, y: 50 },
          data: {},
          isGroup: true,
          highlighted: false,
          groupId: 'group1',
        },
        {
          id: 'node1',
          type: 'default',
          position: { x: 100, y: 100 },
          data: {},
          groupId: 'group2',
        },
      ];

      (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: nodesWithNestedGroups,
        edges: [],
        metadata: {},
      });

      modelLookup.desynchronize();
      const chain = modelLookup.getParentChain('node1');
      expect(chain).toHaveLength(2);
      expect(chain[0].id).toBe('group2');
      expect(chain[1].id).toBe('group1');
    });

    it('should return empty array for non-existent node', () => {
      const chain = modelLookup.getParentChain('nonExistent');
      expect(chain).toEqual([]);
    });

    it('should handle node with non-existent parent gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      const nodesWithBrokenParent = [
        {
          id: 'node1',
          type: 'default',
          position: { x: 0, y: 0 },
          data: {},
          groupId: 'nonExistentGroup',
        },
      ];

      (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: nodesWithBrokenParent,
        edges: [],
        metadata: {},
      });

      modelLookup.desynchronize();
      const chain = modelLookup.getParentChain('node1');
      expect(chain).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Node node1 has a non-existent parent');

      consoleSpy.mockRestore();
    });

    it('should handle node with non-group parent gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      const nodesWithNonGroupParent = [
        {
          id: 'parent',
          type: 'default',
          position: { x: 0, y: 0 },
          data: {},
        },
        {
          id: 'node1',
          type: 'default',
          position: { x: 100, y: 100 },
          data: {},
          groupId: 'parent',
        },
      ];

      (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: nodesWithNonGroupParent,
        edges: [],
        metadata: {},
      });

      modelLookup.desynchronize();
      const chain = modelLookup.getParentChain('node1');
      expect(chain).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Node node1 has a non-group parent parent');

      consoleSpy.mockRestore();
    });
  });

  describe('getAllDescendantIds', () => {
    it('should return all descendant ids for a group node', () => {
      const descendants = modelLookup.getAllDescendantIds('node1');
      expect(descendants).toHaveLength(2);
      expect(descendants).toContain('node2');
      expect(descendants).toContain('node3');
    });

    it('should return only direct child for group with one level', () => {
      const descendants = modelLookup.getAllDescendantIds('node2');
      expect(descendants).toHaveLength(1);
      expect(descendants).toContain('node3');
    });

    it('should return empty array for node without descendants', () => {
      const descendants = modelLookup.getAllDescendantIds('node4');
      expect(descendants).toEqual([]);
    });

    it('should cache descendants for performance', () => {
      const descendants1 = modelLookup.getAllDescendantIds('node1');
      const descendants2 = modelLookup.getAllDescendantIds('node1');
      expect(descendants1).toBe(descendants2); // Should return same reference
    });

    it('should invalidate cache when desynchronized', () => {
      const descendants1 = modelLookup.getAllDescendantIds('node1');

      modelLookup.desynchronize();
      const descendants2 = modelLookup.getAllDescendantIds('node1');

      expect(descendants1).not.toBe(descendants2); // Should return different reference
    });
  });

  describe('getAllDescendants', () => {
    it('should return all descendant nodes for a group node', () => {
      const descendants = modelLookup.getAllDescendants('node1');
      expect(descendants).toHaveLength(2);
      expect(descendants.map((n) => n.id)).toContain('node2');
      expect(descendants.map((n) => n.id)).toContain('node3');
    });

    it('should return only direct child node for group with one level', () => {
      const descendants = modelLookup.getAllDescendants('node2');
      expect(descendants).toHaveLength(1);
      expect(descendants[0].id).toBe('node3');
    });

    it('should return empty array for node without descendants', () => {
      const descendants = modelLookup.getAllDescendants('node4');
      expect(descendants).toEqual([]);
    });
  });
});
