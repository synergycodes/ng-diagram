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

  describe('update', () => {
    it('should update all maps with new state', () => {
      const newNodes = [
        { ...mockNodes[0], id: 'newNode1' },
        { ...mockNodes[1], id: 'newNode2', groupId: 'newNode1' },
      ];
      const newEdges = [{ ...mockEdges[0], id: 'newEdge1' }];

      modelLookup.update({ nodes: newNodes, edges: newEdges });

      expect(modelLookup.nodesMap.size).toBe(2);
      expect(modelLookup.edgesMap.size).toBe(1);
      expect(modelLookup.directChildrenMap.size).toBe(1);
      expect(modelLookup.directChildrenMap.get('newNode1')).toEqual(['newNode2']);
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
});
