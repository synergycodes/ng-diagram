import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EdgeRoutingManager } from '../../../../edge-routing-manager';
import { mockEdge, mockNode } from '../../../../test-utils';
import type { Edge, Node } from '../../../../types';
import { getEdgePoints } from '../get-edge-points';

// Mock the get-source-target-positions module
vi.mock('../get-source-target-positions', () => ({
  getSourceTargetPositions: vi.fn().mockImplementation((edge, nodesMap) => {
    const sourceNode = nodesMap.get(edge.source);
    const targetNode = nodesMap.get(edge.target);

    const sourcePosition = edge.sourcePosition || sourceNode?.position || { x: 0, y: 0 };
    const targetPosition = edge.targetPosition || targetNode?.position || { x: 100, y: 100 };

    return [
      { ...sourcePosition, side: 'right' },
      { ...targetPosition, side: 'left' },
    ];
  }),
}));

describe('getEdgePoints', () => {
  let mockRoutingManager: Partial<EdgeRoutingManager>;
  let nodesMap: Map<string, Node>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRoutingManager = {
      hasRouting: vi.fn().mockReturnValue(true),
      computePoints: vi.fn().mockImplementation((_routing, context) => {
        if (!context?.sourcePoint || !context?.targetPoint) return [];
        return [
          { x: context.sourcePoint.x, y: context.sourcePoint.y },
          { x: 50, y: 50 }, // Middle point
          { x: context.targetPoint.x, y: context.targetPoint.y },
        ];
      }),
      getDefaultRouting: vi.fn().mockReturnValue('polyline'),
    };

    nodesMap = new Map();
  });

  describe('Port Initialization Checks', () => {
    it('should return empty points when ports are not initialized for auto mode edge', () => {
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        sourcePort: 'port-1',
        targetPort: 'port-2',
        routingMode: 'auto',
      };

      const sourceNode: Node = {
        ...mockNode,
        id: 'node-1',
        ports: [
          {
            id: 'port-1',
            type: 'source',
            nodeId: 'node-1',
            side: 'right',
            // Missing position and size - not initialized
          },
        ],
      };

      const targetNode: Node = {
        ...mockNode,
        id: 'node-2',
        ports: [
          {
            id: 'port-2',
            type: 'target',
            nodeId: 'node-2',
            side: 'left',
            position: { x: 100, y: 100 },
            size: { width: 10, height: 10 },
          },
        ],
      };

      nodesMap.set('node-1', sourceNode);
      nodesMap.set('node-2', targetNode);

      const result = getEdgePoints(edge, nodesMap, mockRoutingManager as EdgeRoutingManager);

      expect(result).toEqual({
        sourcePoint: undefined,
        targetPoint: undefined,
        points: [],
      });
    });

    it('should return points for manual mode edge even when ports are not initialized', () => {
      const manualPoints = [
        { x: 10, y: 10 },
        { x: 50, y: 50 },
        { x: 100, y: 100 },
      ];

      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        sourcePort: 'port-1',
        targetPort: 'port-2',
        routingMode: 'manual',
        points: manualPoints,
      };

      const sourceNode: Node = {
        ...mockNode,
        id: 'node-1',
        ports: [
          {
            id: 'port-1',
            type: 'source',
            nodeId: 'node-1',
            side: 'right',
            // Missing position and size
          },
        ],
      };

      nodesMap.set('node-1', sourceNode);

      const result = getEdgePoints(edge, nodesMap, mockRoutingManager as EdgeRoutingManager);

      expect(result.points).toEqual(manualPoints);
      expect(result.sourcePoint).toBeDefined();
      expect(result.targetPoint).toBeDefined();
    });

    it('should proceed when all required ports are initialized', () => {
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        sourcePort: 'port-1',
        targetPort: 'port-2',
      };

      const sourceNode: Node = {
        ...mockNode,
        id: 'node-1',
        position: { x: 0, y: 0 },
        ports: [
          {
            id: 'port-1',
            type: 'source',
            nodeId: 'node-1',
            side: 'right',
            position: { x: 10, y: 10 },
            size: { width: 10, height: 10 },
          },
        ],
      };

      const targetNode: Node = {
        ...mockNode,
        id: 'node-2',
        position: { x: 100, y: 100 },
        ports: [
          {
            id: 'port-2',
            type: 'target',
            nodeId: 'node-2',
            side: 'left',
            position: { x: 110, y: 110 },
            size: { width: 10, height: 10 },
          },
        ],
      };

      nodesMap.set('node-1', sourceNode);
      nodesMap.set('node-2', targetNode);

      const result = getEdgePoints(edge, nodesMap, mockRoutingManager as EdgeRoutingManager);

      expect(result.points).toHaveLength(3); // Source, middle, target
      expect(result.sourcePoint).toBeDefined();
      expect(result.targetPoint).toBeDefined();
    });

    it('should work when edge has no ports specified', () => {
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        // No ports specified
      };

      const sourceNode: Node = {
        ...mockNode,
        id: 'node-1',
        position: { x: 0, y: 0 },
      };

      const targetNode: Node = {
        ...mockNode,
        id: 'node-2',
        position: { x: 100, y: 100 },
      };

      nodesMap.set('node-1', sourceNode);
      nodesMap.set('node-2', targetNode);

      const result = getEdgePoints(edge, nodesMap, mockRoutingManager as EdgeRoutingManager);

      expect(result.points).toHaveLength(3);
      expect(result.sourcePoint).toEqual({ x: 0, y: 0 });
      expect(result.targetPoint).toEqual({ x: 100, y: 100 });
    });
  });

  describe('Routing Mode Handling', () => {
    it('should use manual points when routingMode is manual', () => {
      const manualPoints = [
        { x: 10, y: 10 },
        { x: 20, y: 30 },
        { x: 40, y: 50 },
        { x: 100, y: 100 },
      ];

      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        routingMode: 'manual',
        points: manualPoints,
      };

      nodesMap.set('node-1', { ...mockNode, id: 'node-1', position: { x: 0, y: 0 } });
      nodesMap.set('node-2', { ...mockNode, id: 'node-2', position: { x: 100, y: 100 } });

      const result = getEdgePoints(edge, nodesMap, mockRoutingManager as EdgeRoutingManager);

      expect(result.points).toEqual(manualPoints);
      expect(mockRoutingManager.computePoints).not.toHaveBeenCalled();
    });

    it('should compute points when routingMode is auto', () => {
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        routingMode: 'auto',
        routing: 'orthogonal',
      };

      nodesMap.set('node-1', { ...mockNode, id: 'node-1', position: { x: 0, y: 0 } });
      nodesMap.set('node-2', { ...mockNode, id: 'node-2', position: { x: 100, y: 100 } });

      const result = getEdgePoints(edge, nodesMap, mockRoutingManager as EdgeRoutingManager);

      expect(result.points).toHaveLength(3);
      expect(mockRoutingManager.computePoints).toHaveBeenCalled();
    });

    it('should default to auto mode when routingMode is not specified', () => {
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        // routingMode not specified
      };

      nodesMap.set('node-1', { ...mockNode, id: 'node-1', position: { x: 0, y: 0 } });
      nodesMap.set('node-2', { ...mockNode, id: 'node-2', position: { x: 100, y: 100 } });

      const result = getEdgePoints(edge, nodesMap, mockRoutingManager as EdgeRoutingManager);

      expect(mockRoutingManager.computePoints).toHaveBeenCalled();
      expect(result.points).toHaveLength(3);
    });

    it('should not use manual points if they are empty', () => {
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        routingMode: 'manual',
        points: [], // Empty points
      };

      nodesMap.set('node-1', { ...mockNode, id: 'node-1', position: { x: 0, y: 0 } });
      nodesMap.set('node-2', { ...mockNode, id: 'node-2', position: { x: 100, y: 100 } });

      const result = getEdgePoints(edge, nodesMap, mockRoutingManager as EdgeRoutingManager);

      // Should fall back to computing points
      expect(mockRoutingManager.computePoints).toHaveBeenCalled();
      expect(result.points).toHaveLength(3);
    });
  });

  describe('Routing Algorithm Selection', () => {
    it('should use edge-specific routing when available', () => {
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        routing: 'bezier',
      };

      nodesMap.set('node-1', { ...mockNode, id: 'node-1', position: { x: 0, y: 0 } });
      nodesMap.set('node-2', { ...mockNode, id: 'node-2', position: { x: 100, y: 100 } });

      mockRoutingManager.hasRouting = vi.fn().mockImplementation((routing) => routing === 'bezier');

      getEdgePoints(edge, nodesMap, mockRoutingManager as EdgeRoutingManager);

      expect(mockRoutingManager.hasRouting).toHaveBeenCalledWith('bezier');
      expect(mockRoutingManager.computePoints).toHaveBeenCalledWith('bezier', expect.objectContaining({ edge }));
    });

    it('should fall back to default routing when edge routing is not available', () => {
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        routing: 'custom-routing',
      };

      nodesMap.set('node-1', { ...mockNode, id: 'node-1', position: { x: 0, y: 0 } });
      nodesMap.set('node-2', { ...mockNode, id: 'node-2', position: { x: 100, y: 100 } });

      mockRoutingManager.hasRouting = vi.fn().mockImplementation((routing) => routing === 'polyline');

      getEdgePoints(edge, nodesMap, mockRoutingManager as EdgeRoutingManager);

      expect(mockRoutingManager.hasRouting).toHaveBeenCalledWith('custom-routing');
      expect(mockRoutingManager.getDefaultRouting).toHaveBeenCalled();
      expect(mockRoutingManager.computePoints).toHaveBeenCalledWith('polyline', expect.anything());
    });

    it('should create simple line when no routing is available', () => {
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        sourcePosition: { x: 10, y: 10 },
        targetPosition: { x: 90, y: 90 },
      };

      nodesMap.set('node-1', { ...mockNode, id: 'node-1', position: { x: 0, y: 0 } });
      nodesMap.set('node-2', { ...mockNode, id: 'node-2', position: { x: 100, y: 100 } });

      mockRoutingManager.hasRouting = vi.fn().mockReturnValue(false);

      const result = getEdgePoints(edge, nodesMap, mockRoutingManager as EdgeRoutingManager);

      expect(result.points).toEqual([
        { x: 10, y: 10 },
        { x: 90, y: 90 },
      ]);
    });
  });

  describe('Edge Context Building', () => {
    it('should include source and target ports in routing context', () => {
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        sourcePort: 'port-1',
        targetPort: 'port-2',
      };

      const sourceNode: Node = {
        ...mockNode,
        id: 'node-1',
        ports: [
          {
            id: 'port-1',
            type: 'source',
            nodeId: 'node-1',
            side: 'right',
            position: { x: 10, y: 10 },
            size: { width: 10, height: 10 },
          },
          {
            id: 'port-other',
            type: 'source',
            nodeId: 'node-1',
            side: 'right',
            position: { x: 20, y: 20 },
            size: { width: 10, height: 10 },
          },
        ],
      };

      const targetNode: Node = {
        ...mockNode,
        id: 'node-2',
        ports: [
          {
            id: 'port-2',
            type: 'target',
            nodeId: 'node-2',
            side: 'left',
            position: { x: 90, y: 90 },
            size: { width: 10, height: 10 },
          },
        ],
      };

      nodesMap.set('node-1', sourceNode);
      nodesMap.set('node-2', targetNode);

      getEdgePoints(edge, nodesMap, mockRoutingManager as EdgeRoutingManager);

      expect(mockRoutingManager.computePoints).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          sourcePort: sourceNode.ports![0],
          targetPort: targetNode.ports![0],
          sourceNode,
          targetNode,
        })
      );
    });

    it('should handle edges with no nodes in map', () => {
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        source: 'non-existent-1',
        target: 'non-existent-2',
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 100, y: 100 },
      };

      const result = getEdgePoints(edge, nodesMap, mockRoutingManager as EdgeRoutingManager);

      expect(result.sourcePoint).toEqual({ x: 0, y: 0 });
      expect(result.targetPoint).toEqual({ x: 100, y: 100 });
      expect(result.points).toHaveLength(3);
    });
  });

  describe('Special Cases', () => {
    it('should handle temporary edges without target node', () => {
      const edge: Edge = {
        ...mockEdge,
        id: 'temp-edge',
        source: 'node-1',
        target: '', // Empty target for temporary edge
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 50, y: 50 }, // Mouse position
        temporary: true,
      };

      nodesMap.set('node-1', { ...mockNode, id: 'node-1', position: { x: 0, y: 0 } });

      const result = getEdgePoints(edge, nodesMap, mockRoutingManager as EdgeRoutingManager);

      expect(result.sourcePoint).toEqual({ x: 0, y: 0 });
      expect(result.targetPoint).toEqual({ x: 50, y: 50 });
      expect(result.points).toBeDefined();
    });
  });
});
