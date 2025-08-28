import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EdgeRoutingManager } from '../../../../edge-routing-manager';
import { mockEdge, mockNode } from '../../../../test-utils';
import type { Edge, Node, PortLocation } from '../../../../types';
import {
  areEdgePortsInitialized,
  computeAutoModePoints,
  findNodePort,
  portLocationToPoint,
  shouldSkipPortInitCheck,
} from '../get-edge-points';

describe('Get Edge Points Helper Functions', () => {
  let mockRoutingManager: Partial<EdgeRoutingManager>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRoutingManager = {
      hasRouting: vi.fn().mockReturnValue(true),
      computePoints: vi.fn().mockReturnValue([
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 100 },
      ]),
      getDefaultRouting: vi.fn().mockReturnValue('polyline'),
    };
  });

  describe('areEdgePortsInitialized', () => {
    it('should return true when edge has no ports', () => {
      const edge: Edge = {
        ...mockEdge,
        // No ports specified
      };
      const sourceNode: Node = { ...mockNode };
      const targetNode: Node = { ...mockNode };

      const result = areEdgePortsInitialized(edge, sourceNode, targetNode);
      expect(result).toBe(true);
    });

    it('should return false when source port is not initialized', () => {
      const edge: Edge = {
        ...mockEdge,
        sourcePort: 'port-1',
      };
      const sourceNode: Node = {
        ...mockNode,
        ports: [
          {
            id: 'port-1',
            type: 'source',
            nodeId: 'source-node',
            side: 'right',
            // Missing position and size
          },
        ],
      };

      const result = areEdgePortsInitialized(edge, sourceNode, undefined);
      expect(result).toBe(false);
    });

    it('should return false when source port has position but no size', () => {
      const edge: Edge = {
        ...mockEdge,
        sourcePort: 'port-1',
      };
      const sourceNode: Node = {
        ...mockNode,
        ports: [
          {
            id: 'port-1',
            type: 'source',
            nodeId: 'source-node',
            side: 'right',
            position: { x: 10, y: 10 },
            // Missing size
          },
        ],
      };

      const result = areEdgePortsInitialized(edge, sourceNode, undefined);
      expect(result).toBe(false);
    });

    it('should return false when target port is not initialized', () => {
      const edge: Edge = {
        ...mockEdge,
        sourcePort: 'port-1',
        targetPort: 'port-2',
      };
      const sourceNode: Node = {
        ...mockNode,
        ports: [
          {
            id: 'port-1',
            type: 'source',
            nodeId: 'source-node',
            side: 'right',
            position: { x: 10, y: 10 },
            size: { width: 10, height: 10 },
          },
        ],
      };
      const targetNode: Node = {
        ...mockNode,
        ports: [
          {
            id: 'port-2',
            type: 'target',
            nodeId: 'target-node',
            side: 'left',
            position: { x: 90, y: 90 },
            // Missing size
          },
        ],
      };

      const result = areEdgePortsInitialized(edge, sourceNode, targetNode);
      expect(result).toBe(false);
    });

    it('should return true when all ports are initialized', () => {
      const edge: Edge = {
        ...mockEdge,
        sourcePort: 'port-1',
        targetPort: 'port-2',
      };
      const sourceNode: Node = {
        ...mockNode,
        ports: [
          {
            id: 'port-1',
            type: 'source',
            nodeId: 'source-node',
            side: 'right',
            position: { x: 10, y: 10 },
            size: { width: 10, height: 10 },
          },
        ],
      };
      const targetNode: Node = {
        ...mockNode,
        ports: [
          {
            id: 'port-2',
            type: 'target',
            nodeId: 'target-node',
            side: 'left',
            position: { x: 90, y: 90 },
            size: { width: 10, height: 10 },
          },
        ],
      };

      const result = areEdgePortsInitialized(edge, sourceNode, targetNode);
      expect(result).toBe(true);
    });

    it('should handle undefined nodes', () => {
      const edge: Edge = {
        ...mockEdge,
        sourcePort: 'port-1',
        targetPort: 'port-2',
      };

      const result = areEdgePortsInitialized(edge, undefined, undefined);
      expect(result).toBe(true);
    });
  });

  describe('shouldSkipPortInitCheck', () => {
    it('should return true for manual mode edge with points', () => {
      const edge: Edge = {
        ...mockEdge,
        routingMode: 'manual',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 100 },
        ],
      };

      const result = shouldSkipPortInitCheck(edge);
      expect(result).toBe(true);
    });

    it('should return false for manual mode edge without points', () => {
      const edge: Edge = {
        ...mockEdge,
        routingMode: 'manual',
        points: undefined,
      };

      const result = shouldSkipPortInitCheck(edge);
      expect(result).toBe(false);
    });

    it('should return false for manual mode edge with empty points', () => {
      const edge: Edge = {
        ...mockEdge,
        routingMode: 'manual',
        points: [],
      };

      const result = shouldSkipPortInitCheck(edge);
      expect(result).toBe(false);
    });

    it('should return false for auto mode edge with points', () => {
      const edge: Edge = {
        ...mockEdge,
        routingMode: 'auto',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 100 },
        ],
      };

      const result = shouldSkipPortInitCheck(edge);
      expect(result).toBe(false);
    });

    it('should return false when routingMode is not specified', () => {
      const edge: Edge = {
        ...mockEdge,
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 100 },
        ],
      };

      const result = shouldSkipPortInitCheck(edge);
      expect(result).toBe(false);
    });
  });

  describe('portLocationToPoint', () => {
    it('should convert PortLocation to Point', () => {
      const location: PortLocation = {
        x: 50,
        y: 75,
        side: 'right',
      };

      const result = portLocationToPoint(location);
      expect(result).toEqual({ x: 50, y: 75 });
    });

    it('should return undefined for undefined location', () => {
      const result = portLocationToPoint(undefined);
      expect(result).toBeUndefined();
    });

    it('should return undefined when x/y is undefined', () => {
      const location = {
        side: 'right',
      } as PortLocation;

      const result = portLocationToPoint(location);
      expect(result).toBeUndefined();
    });

    it('should handle location with x = 0', () => {
      const location: PortLocation = {
        x: 0,
        y: 100,
        side: 'left',
      };

      const result = portLocationToPoint(location);
      expect(result).toEqual({ x: 0, y: 100 });
    });

    it('should handle location with negative coordinates', () => {
      const location: PortLocation = {
        x: -50,
        y: -75,
        side: 'top',
      };

      const result = portLocationToPoint(location);
      expect(result).toEqual({ x: -50, y: -75 });
    });
  });

  describe('findNodePort', () => {
    it('should find port by ID', () => {
      const node: Node = {
        ...mockNode,
        ports: [
          { id: 'port-1', type: 'source', nodeId: 'test-node', side: 'right', position: { x: 10, y: 10 } },
          { id: 'port-2', type: 'source', nodeId: 'test-node', side: 'right', position: { x: 20, y: 20 } },
          { id: 'port-3', type: 'source', nodeId: 'test-node', side: 'right', position: { x: 30, y: 30 } },
        ],
      };

      const result = findNodePort(node, 'port-2');
      expect(result).toEqual({
        id: 'port-2',
        type: 'source',
        nodeId: 'test-node',
        side: 'right',
        position: { x: 20, y: 20 },
      });
    });

    it('should return undefined when port is not found', () => {
      const node: Node = {
        ...mockNode,
        ports: [{ id: 'port-1', type: 'source', nodeId: 'test-node', side: 'right', position: { x: 10, y: 10 } }],
      };

      const result = findNodePort(node, 'non-existent-port');
      expect(result).toBeUndefined();
    });

    it('should return undefined when node is undefined', () => {
      const result = findNodePort(undefined, 'port-1');
      expect(result).toBeUndefined();
    });

    it('should return undefined when portId is undefined', () => {
      const node: Node = {
        ...mockNode,
        ports: [{ id: 'port-1', type: 'source', nodeId: 'test-node', side: 'right', position: { x: 10, y: 10 } }],
      };

      const result = findNodePort(node, undefined);
      expect(result).toBeUndefined();
    });

    it('should return undefined when node has no ports', () => {
      const node: Node = {
        ...mockNode,
        ports: undefined,
      };

      const result = findNodePort(node, 'port-1');
      expect(result).toBeUndefined();
    });

    it('should return undefined when node has empty ports array', () => {
      const node: Node = {
        ...mockNode,
        ports: [],
      };

      const result = findNodePort(node, 'port-1');
      expect(result).toBeUndefined();
    });
  });

  describe('computeAutoModePoints', () => {
    const sourceLocation: PortLocation = { x: 0, y: 0, side: 'right' };
    const targetLocation: PortLocation = { x: 100, y: 100, side: 'left' };
    const sourceNode: Node = { ...mockNode, id: 'source-node' };
    const targetNode: Node = { ...mockNode, id: 'target-node' };

    it('should compute points using edge-specific routing', () => {
      const edge: Edge = {
        ...mockEdge,
        routing: 'bezier',
      };

      mockRoutingManager.hasRouting = vi.fn().mockImplementation((r) => r === 'bezier');
      mockRoutingManager.computePoints = vi.fn().mockReturnValue([
        { x: 0, y: 0 },
        { x: 25, y: 50 },
        { x: 75, y: 50 },
        { x: 100, y: 100 },
      ]);

      const result = computeAutoModePoints(
        edge,
        sourceLocation,
        targetLocation,
        sourceNode,
        targetNode,
        mockRoutingManager as EdgeRoutingManager
      );

      expect(mockRoutingManager.hasRouting).toHaveBeenCalledWith('bezier');
      expect(mockRoutingManager.computePoints).toHaveBeenCalledWith(
        'bezier',
        expect.objectContaining({
          sourcePoint: sourceLocation,
          targetPoint: targetLocation,
          edge,
          sourceNode,
          targetNode,
        })
      );
      expect(result).toEqual([
        { x: 0, y: 0 },
        { x: 25, y: 50 },
        { x: 75, y: 50 },
        { x: 100, y: 100 },
      ]);
    });

    it('should fall back to default routing when edge routing is not available', () => {
      const edge: Edge = {
        ...mockEdge,
        routing: 'custom-routing',
      };

      mockRoutingManager.hasRouting = vi.fn().mockImplementation((r) => r === 'polyline');
      mockRoutingManager.getDefaultRouting = vi.fn().mockReturnValue('polyline');

      computeAutoModePoints(
        edge,
        sourceLocation,
        targetLocation,
        sourceNode,
        targetNode,
        mockRoutingManager as EdgeRoutingManager
      );

      expect(mockRoutingManager.hasRouting).toHaveBeenCalledWith('custom-routing');
      expect(mockRoutingManager.getDefaultRouting).toHaveBeenCalled();
      expect(mockRoutingManager.computePoints).toHaveBeenCalledWith('polyline', expect.anything());
    });

    it('should create simple line when no routing is available', () => {
      const edge: Edge = { ...mockEdge };

      mockRoutingManager.hasRouting = vi.fn().mockReturnValue(false);

      const result = computeAutoModePoints(
        edge,
        sourceLocation,
        targetLocation,
        sourceNode,
        targetNode,
        mockRoutingManager as EdgeRoutingManager
      );

      expect(result).toEqual([
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ]);
    });

    it('should include ports in routing context when available', () => {
      const edge: Edge = {
        ...mockEdge,
        sourcePort: 'port-1',
        targetPort: 'port-2',
      };

      const sourceNodeWithPorts: Node = {
        ...sourceNode,
        ports: [{ id: 'port-1', type: 'source', nodeId: 'source-node', side: 'right', position: { x: 5, y: 5 } }],
      };

      const targetNodeWithPorts: Node = {
        ...targetNode,
        ports: [{ id: 'port-2', type: 'target', nodeId: 'target-node', side: 'left', position: { x: 95, y: 95 } }],
      };

      computeAutoModePoints(
        edge,
        sourceLocation,
        targetLocation,
        sourceNodeWithPorts,
        targetNodeWithPorts,
        mockRoutingManager as EdgeRoutingManager
      );

      expect(mockRoutingManager.computePoints).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          sourcePort: sourceNodeWithPorts.ports![0],
          targetPort: targetNodeWithPorts.ports![0],
        })
      );
    });

    it('should handle missing nodes', () => {
      const edge: Edge = {
        ...mockEdge,
        sourcePort: 'port-1',
        targetPort: 'port-2',
      };

      computeAutoModePoints(
        edge,
        sourceLocation,
        targetLocation,
        undefined,
        undefined,
        mockRoutingManager as EdgeRoutingManager
      );

      expect(mockRoutingManager.computePoints).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          sourceNode: undefined,
          targetNode: undefined,
          sourcePort: undefined,
          targetPort: undefined,
        })
      );
    });

    it('should use edge without routing property', () => {
      const edge: Edge = {
        ...mockEdge,
        // No routing specified
      };

      mockRoutingManager.hasRouting = vi
        .fn()
        .mockReturnValueOnce(false) // Edge routing check
        .mockReturnValueOnce(true); // Default routing check

      const result = computeAutoModePoints(
        edge,
        sourceLocation,
        targetLocation,
        sourceNode,
        targetNode,
        mockRoutingManager as EdgeRoutingManager
      );

      expect(mockRoutingManager.getDefaultRouting).toHaveBeenCalled();
      expect(result).toHaveLength(2); // Fallback creates simple line with 2 points
    });
  });
});
