import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowCore } from '../../flow-core';
import { SpatialHash } from '../../spatial-hash/spatial-hash';
import { mockEdge, mockGroupNode, mockNode } from '../../test-utils';
import type { Edge, Node, Viewport, VirtualizationConfig } from '../../types';
import { VirtualizedRenderStrategy } from './virtualized-render-strategy';

describe('VirtualizedRenderStrategy', () => {
  let spatialHash: SpatialHash;
  let mockFlowCore: FlowCore;
  let strategy: VirtualizedRenderStrategy;
  let config: VirtualizationConfig;

  const defaultViewport: Viewport = {
    x: 0,
    y: 0,
    scale: 1,
    width: 800,
    height: 600,
  };

  const defaultConfig: VirtualizationConfig = {
    enabled: true,
    padding: 0.1, // 10% of viewport size as padding
  };

  beforeEach(() => {
    spatialHash = new SpatialHash();
    config = { ...defaultConfig };

    // Create a mock FlowCore with required properties
    const nodesMap = new Map<string, Node>();
    mockFlowCore = {
      config: {
        virtualization: config,
      },
      spatialHash,
      modelLookup: {
        nodesMap,
        getNodeById: vi.fn((id: string) => nodesMap.get(id)),
        getConnectedEdges: vi.fn().mockReturnValue([]),
        getAllDescendantIds: vi.fn().mockReturnValue([]),
      },
      actionStateManager: {
        isPanning: vi.fn().mockReturnValue(false),
      },
      eventManager: {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        on: vi.fn().mockReturnValue(() => {}), // Returns unsubscribe function
      },
      render: vi.fn(),
    } as unknown as FlowCore;

    strategy = new VirtualizedRenderStrategy(mockFlowCore);
  });

  // Helper to update nodesMap when nodes change
  function updateNodesMap(nodes: Node[]): void {
    const nodesMap = mockFlowCore.modelLookup.nodesMap as Map<string, Node>;
    nodesMap.clear();
    for (const node of nodes) {
      nodesMap.set(node.id, node);
    }
  }

  describe('bypass conditions', () => {
    it('should return all nodes when viewport is undefined', () => {
      const nodes: Node[] = [
        { ...mockNode, id: '1', position: { x: 0, y: 0 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '2', position: { x: 1000, y: 1000 }, size: { width: 50, height: 50 } },
      ];
      const edges: Edge[] = [];
      spatialHash.process(nodes);

      const result = strategy.process(nodes, edges, undefined);

      expect(result.nodes).toEqual(nodes);
      expect(result.edges).toEqual(edges);
    });
  });

  describe('viewport filtering', () => {
    it('should include nodes inside viewport', () => {
      const nodes: Node[] = [
        { ...mockNode, id: '1', position: { x: 100, y: 100 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '2', position: { x: 200, y: 200 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '3', position: { x: 2000, y: 2000 }, size: { width: 50, height: 50 } },
      ];
      const edges: Edge[] = [];
      spatialHash.process(nodes);
      updateNodesMap(nodes);

      const result = strategy.process(nodes, edges, defaultViewport);

      expect(result.nodes.map((n) => n.id)).toContain('1');
      expect(result.nodes.map((n) => n.id)).toContain('2');
      expect(result.nodes.map((n) => n.id)).not.toContain('3');
    });

    it('should include nodes within padding area', () => {
      config.padding = 0.25; // 25% of viewport size as padding
      const nodes: Node[] = [
        { ...mockNode, id: '1', position: { x: 100, y: 100 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '2', position: { x: -150, y: 100 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '3', position: { x: 2000, y: 2000 }, size: { width: 50, height: 50 } },
      ];
      const edges: Edge[] = [];
      spatialHash.process(nodes);
      updateNodesMap(nodes);

      const result = strategy.process(nodes, edges, defaultViewport);

      expect(result.nodes.map((n) => n.id)).toContain('1');
      expect(result.nodes.map((n) => n.id)).toContain('2');
      expect(result.nodes.map((n) => n.id)).not.toContain('3');
    });
  });

  describe('edge handling', () => {
    it('should include edges connected to visible nodes', () => {
      const nodes: Node[] = [
        { ...mockNode, id: '1', position: { x: 100, y: 100 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '2', position: { x: 200, y: 200 }, size: { width: 50, height: 50 } },
      ];
      const edge: Edge = { ...mockEdge, id: 'e1', source: '1', target: '2' };
      const edges: Edge[] = [edge];
      spatialHash.process(nodes);
      updateNodesMap(nodes);
      vi.mocked(mockFlowCore.modelLookup.getConnectedEdges).mockImplementation((nodeId: string) => {
        if (nodeId === '1' || nodeId === '2') return [edge];
        return [];
      });

      const result = strategy.process(nodes, edges, defaultViewport);

      expect(result.edges).toContain(edge);
    });

    it('should include external node when edge spans viewport boundary', () => {
      const nodes: Node[] = [
        { ...mockNode, id: '1', position: { x: 100, y: 100 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '2', position: { x: 2000, y: 2000 }, size: { width: 50, height: 50 } },
      ];
      const edge: Edge = { ...mockEdge, id: 'e1', source: '1', target: '2' };
      const edges: Edge[] = [edge];
      spatialHash.process(nodes);
      updateNodesMap(nodes);
      vi.mocked(mockFlowCore.modelLookup.getConnectedEdges).mockImplementation((nodeId: string) => {
        if (nodeId === '1') return [edge];
        return [];
      });

      const result = strategy.process(nodes, edges, defaultViewport);

      expect(result.nodes.map((n) => n.id)).toContain('1');
      expect(result.nodes.map((n) => n.id)).toContain('2');
      expect(result.edges.map((e) => e.id)).toContain('e1');
    });

    it('should not include edges where both endpoints are outside viewport', () => {
      const nodes: Node[] = [
        { ...mockNode, id: '1', position: { x: 100, y: 100 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '2', position: { x: 2000, y: 2000 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '3', position: { x: 3000, y: 3000 }, size: { width: 50, height: 50 } },
      ];
      const edgeInViewport: Edge = { ...mockEdge, id: 'e1', source: '1', target: '1' };
      const edgeOutsideViewport: Edge = { ...mockEdge, id: 'e2', source: '2', target: '3' };
      const edges: Edge[] = [edgeInViewport, edgeOutsideViewport];
      spatialHash.process(nodes);
      updateNodesMap(nodes);
      vi.mocked(mockFlowCore.modelLookup.getConnectedEdges).mockImplementation((nodeId: string) => {
        if (nodeId === '1') return [edgeInViewport];
        if (nodeId === '2') return [edgeOutsideViewport];
        if (nodeId === '3') return [edgeOutsideViewport];
        return [];
      });

      const result = strategy.process(nodes, edges, defaultViewport);

      expect(result.edges.map((e) => e.id)).not.toContain('e2');
    });
  });

  describe('group node handling', () => {
    it('should include descendants when group node is visible', () => {
      const groupNode = { ...mockGroupNode, id: 'g1', position: { x: 100, y: 100 }, size: { width: 200, height: 200 } };
      const childNode = {
        ...mockNode,
        id: 'c1',
        position: { x: 2000, y: 2000 },
        size: { width: 50, height: 50 },
        groupId: 'g1',
      };
      const nodes: Node[] = [groupNode, childNode];
      const edges: Edge[] = [];
      spatialHash.process(nodes);
      updateNodesMap(nodes);
      vi.mocked(mockFlowCore.modelLookup.getAllDescendantIds).mockImplementation((groupId: string) => {
        if (groupId === 'g1') return ['c1'];
        return [];
      });

      const result = strategy.process(nodes, edges, defaultViewport);

      expect(result.nodes.map((n) => n.id)).toContain('g1');
      expect(result.nodes.map((n) => n.id)).toContain('c1');
    });
  });

  describe('viewport with pan and zoom', () => {
    it('should correctly calculate viewport rect when panned', () => {
      const nodes: Node[] = [
        { ...mockNode, id: '1', position: { x: 500, y: 400 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '2', position: { x: 100, y: 100 }, size: { width: 50, height: 50 } },
      ];
      const edges: Edge[] = [];
      const pannedViewport: Viewport = {
        x: -500,
        y: -400,
        scale: 1,
        width: 800,
        height: 600,
      };
      spatialHash.process(nodes);
      updateNodesMap(nodes);

      const result = strategy.process(nodes, edges, pannedViewport);

      expect(result.nodes.map((n) => n.id)).toContain('1');
    });

    it('should correctly calculate viewport rect when zoomed', () => {
      const nodes: Node[] = [
        { ...mockNode, id: '1', position: { x: 100, y: 100 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '2', position: { x: 1000, y: 1000 }, size: { width: 50, height: 50 } },
      ];
      const edges: Edge[] = [];
      const zoomedViewport: Viewport = {
        x: 0,
        y: 0,
        scale: 0.5,
        width: 800,
        height: 600,
      };
      spatialHash.process(nodes);
      updateNodesMap(nodes);

      const result = strategy.process(nodes, edges, zoomedViewport);

      expect(result.nodes.map((n) => n.id)).toContain('1');
      expect(result.nodes.map((n) => n.id)).toContain('2');
    });
  });

  describe('caching', () => {
    it('should reuse cached ID Sets when viewport has not changed significantly', () => {
      const nodes: Node[] = [
        { ...mockNode, id: '1', position: { x: 100, y: 100 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '2', position: { x: 200, y: 200 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '3', position: { x: 300, y: 300 }, size: { width: 50, height: 50 } },
      ];
      const edges: Edge[] = [];
      spatialHash.process(nodes);
      updateNodesMap(nodes);

      const result1 = strategy.process(nodes, edges, defaultViewport);
      const result2 = strategy.process(nodes, edges, defaultViewport);

      // The cached Sets should be the same reference (optimization: no new Set allocation)
      expect(result1.nodeIds).toBe(result2.nodeIds);
      expect(result1.edgeIds).toBe(result2.edgeIds);
    });

    it('should reuse cached ID Sets for small viewport movements (within 25% threshold)', () => {
      const nodes: Node[] = [
        { ...mockNode, id: '1', position: { x: 100, y: 100 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '2', position: { x: 200, y: 200 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '3', position: { x: 300, y: 300 }, size: { width: 50, height: 50 } },
      ];
      const edges: Edge[] = [];
      spatialHash.process(nodes);
      updateNodesMap(nodes);

      const result1 = strategy.process(nodes, edges, defaultViewport);
      // Small movement (100px is less than 25% of 800+200 padding = 250)
      const smallMovement: Viewport = { ...defaultViewport, x: -100 };
      const result2 = strategy.process(nodes, edges, smallMovement);

      // The cached Sets should be the same reference (optimization: no new Set allocation)
      expect(result1.nodeIds).toBe(result2.nodeIds);
      expect(result1.edgeIds).toBe(result2.edgeIds);
    });

    it('should create new ID Sets when viewport moves significantly (beyond 25% threshold)', () => {
      const nodes: Node[] = [
        { ...mockNode, id: '1', position: { x: 100, y: 100 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '2', position: { x: 200, y: 200 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '3', position: { x: 300, y: 300 }, size: { width: 50, height: 50 } },
      ];
      const edges: Edge[] = [];
      spatialHash.process(nodes);
      updateNodesMap(nodes);

      const result1 = strategy.process(nodes, edges, defaultViewport);
      // Large movement (500px is more than 25% of viewport)
      const largeMovement: Viewport = { ...defaultViewport, x: -500 };
      const result2 = strategy.process(nodes, edges, largeMovement);

      // New Sets should be created when cache is invalidated
      expect(result1.nodeIds).not.toBe(result2.nodeIds);
      expect(result1.edgeIds).not.toBe(result2.edgeIds);
    });

    it('should create new ID Sets when node count changes', () => {
      const nodes1: Node[] = [
        { ...mockNode, id: '1', position: { x: 100, y: 100 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '2', position: { x: 200, y: 200 }, size: { width: 50, height: 50 } },
        { ...mockNode, id: '3', position: { x: 300, y: 300 }, size: { width: 50, height: 50 } },
      ];
      const nodes2: Node[] = [
        ...nodes1,
        { ...mockNode, id: '4', position: { x: 400, y: 400 }, size: { width: 50, height: 50 } },
      ];
      const edges: Edge[] = [];
      spatialHash.process(nodes1);
      updateNodesMap(nodes1);

      const result1 = strategy.process(nodes1, edges, defaultViewport);

      spatialHash.process(nodes2);
      updateNodesMap(nodes2);
      const result2 = strategy.process(nodes2, edges, defaultViewport);

      // New Sets should be created when node count changes
      expect(result1.nodeIds).not.toBe(result2.nodeIds);
    });
  });
});
