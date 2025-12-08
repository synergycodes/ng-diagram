import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '../../types';
import { calculatePartsBounds, getEdgeMeasuredBounds, getNodeMeasuredBounds } from '../dimensions';

describe('dimensions', () => {
  describe('getEdgeMeasuredBounds', () => {
    it('should return bounding rect for edge with points', () => {
      const edge: Edge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        data: {},
        points: [
          { x: 10, y: 20 },
          { x: 50, y: 100 },
          { x: 30, y: 60 },
        ],
      };

      const result = getEdgeMeasuredBounds(edge);

      expect(result).toEqual({
        x: 10,
        y: 20,
        width: 40,
        height: 80,
      });
    });

    it('should handle edge with single point', () => {
      const edge: Edge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        data: {},
        points: [{ x: 15, y: 25 }],
      };

      const result = getEdgeMeasuredBounds(edge);

      expect(result).toEqual({
        x: 15,
        y: 25,
        width: 0,
        height: 0,
      });
    });

    it('should handle edge with no points', () => {
      const edge: Edge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        data: {},
      };

      const result = getEdgeMeasuredBounds(edge);

      expect(result).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
    });

    it('should handle edge with empty points array', () => {
      const edge: Edge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        data: {},
        points: [],
      };

      const result = getEdgeMeasuredBounds(edge);

      expect(result).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
    });

    it('should handle edge with negative coordinates', () => {
      const edge: Edge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        data: {},
        points: [
          { x: -10, y: -20 },
          { x: 10, y: 20 },
        ],
      };

      const result = getEdgeMeasuredBounds(edge);

      expect(result).toEqual({
        x: -10,
        y: -20,
        width: 20,
        height: 40,
      });
    });

    it('should include measuredLabels in bounds calculation', () => {
      const edge: Edge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        data: {},
        points: [
          { x: 10, y: 10 },
          { x: 100, y: 10 },
        ],
        measuredLabels: [
          {
            id: 'label-1',
            positionOnEdge: 0.5,
            position: { x: 50, y: -20 },
            size: { width: 40, height: 20 },
          },
        ],
      };

      const result = getEdgeMeasuredBounds(edge);

      expect(result).toEqual({
        x: 10,
        y: -20,
        width: 90,
        height: 30,
      });
    });

    it('should handle labels extending beyond edge points', () => {
      const edge: Edge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        data: {},
        points: [
          { x: 50, y: 50 },
          { x: 100, y: 50 },
        ],
        measuredLabels: [
          {
            id: 'label-1',
            positionOnEdge: 0,
            position: { x: 20, y: 30 },
            size: { width: 60, height: 40 },
          },
          {
            id: 'label-2',
            positionOnEdge: 1,
            position: { x: 90, y: 60 },
            size: { width: 50, height: 30 },
          },
        ],
      };

      const result = getEdgeMeasuredBounds(edge);

      expect(result).toEqual({
        x: 20,
        y: 30,
        width: 120,
        height: 60,
      });
    });

    it('should handle labels without position or size', () => {
      const edge: Edge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        data: {},
        points: [
          { x: 10, y: 20 },
          { x: 50, y: 100 },
        ],
        measuredLabels: [
          {
            id: 'label-1',
            positionOnEdge: 0.5,
          },
          {
            id: 'label-2',
            positionOnEdge: 0.5,
            position: { x: 30, y: 60 },
          },
        ],
      };

      const result = getEdgeMeasuredBounds(edge);

      expect(result).toEqual({
        x: 10,
        y: 20,
        width: 40,
        height: 80,
      });
    });

    it('should handle empty measuredLabels array', () => {
      const edge: Edge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        data: {},
        points: [
          { x: 10, y: 20 },
          { x: 50, y: 100 },
        ],
        measuredLabels: [],
      };

      const result = getEdgeMeasuredBounds(edge);

      expect(result).toEqual({
        x: 10,
        y: 20,
        width: 40,
        height: 80,
      });
    });
  });

  describe('getNodeMeasuredBounds', () => {
    it('should return node bounds without rotation', () => {
      const node: Node = {
        id: 'node-1',
        position: { x: 100, y: 200 },
        size: { width: 50, height: 80 },
        data: {},
      };

      const result = getNodeMeasuredBounds(node);

      expect(result).toEqual({
        x: 100,
        y: 200,
        width: 50,
        height: 80,
      });
    });

    it('should return node bounds with zero angle', () => {
      const node: Node = {
        id: 'node-1',
        position: { x: 100, y: 200 },
        size: { width: 50, height: 80 },
        angle: 0,
        data: {},
      };

      const result = getNodeMeasuredBounds(node);

      expect(result).toEqual({
        x: 100,
        y: 200,
        width: 50,
        height: 80,
      });
    });

    it('should calculate bounds for node with 90 degree rotation', () => {
      const node: Node = {
        id: 'node-1',
        position: { x: 100, y: 100 },
        size: { width: 40, height: 20 },
        angle: 90,
        data: {},
      };

      const result = getNodeMeasuredBounds(node);

      expect(result.x).toBeCloseTo(110, 1);
      expect(result.y).toBeCloseTo(90, 1);
      expect(result.width).toBeCloseTo(20, 1);
      expect(result.height).toBeCloseTo(40, 1);
    });

    it('should calculate bounds for node with 45 degree rotation', () => {
      const node: Node = {
        id: 'node-1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        angle: 45,
        data: {},
      };

      const result = getNodeMeasuredBounds(node);

      const expectedSize = 100 * Math.sqrt(2);
      expect(result.width).toBeCloseTo(expectedSize, 1);
      expect(result.height).toBeCloseTo(expectedSize, 1);
      expect(result.x).toBeCloseTo(50 - expectedSize / 2, 1);
      expect(result.y).toBeCloseTo(50 - expectedSize / 2, 1);
    });

    it('should calculate bounds for node with 180 degree rotation', () => {
      const node: Node = {
        id: 'node-1',
        position: { x: 100, y: 200 },
        size: { width: 50, height: 80 },
        angle: 180,
        data: {},
      };

      const result = getNodeMeasuredBounds(node);

      expect(result.x).toBeCloseTo(100, 1);
      expect(result.y).toBeCloseTo(200, 1);
      expect(result.width).toBeCloseTo(50, 1);
      expect(result.height).toBeCloseTo(80, 1);
    });

    it('should handle node with ports extending beyond node bounds', () => {
      const node: Node = {
        id: 'node-1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
        data: {},
        measuredPorts: [
          {
            id: 'port-1',
            position: { x: -10, y: 50 },
            size: { width: 20, height: 10 },
            type: 'both',
            nodeId: 'node-1',
            side: 'left',
          },
          {
            id: 'port-2',
            position: { x: 90, y: -10 },
            size: { width: 10, height: 20 },
            type: 'both',
            nodeId: 'node-1',
            side: 'top',
          },
        ],
      };

      const result = getNodeMeasuredBounds(node);

      expect(result).toEqual({
        x: 90,
        y: 90,
        width: 110,
        height: 110,
      });
    });

    it('should handle node with ports inside node bounds', () => {
      const node: Node = {
        id: 'node-1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
        data: {},
        measuredPorts: [
          {
            id: 'port-1',
            position: { x: 10, y: 10 },
            size: { width: 20, height: 20 },
            type: 'both',
            nodeId: 'node-1',
            side: 'top',
          },
        ],
      };

      const result = getNodeMeasuredBounds(node);

      expect(result).toEqual({
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      });
    });

    it('should handle node with no ports', () => {
      const node: Node = {
        id: 'node-1',
        position: { x: 50, y: 75 },
        size: { width: 120, height: 90 },
        data: {},
        measuredPorts: [],
      };

      const result = getNodeMeasuredBounds(node);

      expect(result).toEqual({
        x: 50,
        y: 75,
        width: 120,
        height: 90,
      });
    });

    it('should handle node without measuredPorts property', () => {
      const node: Node = {
        id: 'node-1',
        position: { x: 50, y: 75 },
        size: { width: 120, height: 90 },
        data: {},
      };

      const result = getNodeMeasuredBounds(node);

      expect(result).toEqual({
        x: 50,
        y: 75,
        width: 120,
        height: 90,
      });
    });

    it('should handle rotated node with ports', () => {
      const node: Node = {
        id: 'node-1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        angle: 90,
        data: {},
        measuredPorts: [
          {
            id: 'port-1',
            position: { x: -10, y: 20 },
            size: { width: 20, height: 10 },
            type: 'both',
            nodeId: 'node-1',
            side: 'left',
          },
        ],
      };

      const result = getNodeMeasuredBounds(node);

      expect(result.width).toBeGreaterThanOrEqual(50);
      expect(result.height).toBeGreaterThanOrEqual(100);
      expect(Number.isFinite(result.x)).toBe(true);
      expect(Number.isFinite(result.y)).toBe(true);
    });

    it('should handle node with default size', () => {
      const node: Node = {
        id: 'node-1',
        position: { x: 10, y: 20 },
        data: {},
      };

      const result = getNodeMeasuredBounds(node);

      expect(result).toEqual({
        x: 10,
        y: 20,
        width: 1,
        height: 1,
      });
    });

    it('should handle node with multiple ports in different directions', () => {
      const node: Node = {
        id: 'node-1',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 },
        data: {},
        measuredPorts: [
          {
            id: 'port-left',
            position: { x: -15, y: 40 },
            size: { width: 20, height: 10 },
            type: 'both',
            nodeId: 'node-1',
            side: 'left',
          },
          {
            id: 'port-right',
            position: { x: 95, y: 40 },
            size: { width: 20, height: 10 },
            type: 'both',
            nodeId: 'node-1',
            side: 'right',
          },
          {
            id: 'port-top',
            position: { x: 40, y: -15 },
            size: { width: 10, height: 20 },
            type: 'both',
            nodeId: 'node-1',
            side: 'top',
          },
          {
            id: 'port-bottom',
            position: { x: 40, y: 95 },
            size: { width: 10, height: 20 },
            type: 'both',
            nodeId: 'node-1',
            side: 'bottom',
          },
        ],
      };

      const result = getNodeMeasuredBounds(node);

      expect(result).toEqual({
        x: 85,
        y: 85,
        width: 130,
        height: 130,
      });
    });
  });

  describe('calculatePartsBounds', () => {
    it('should calculate bounds for nodes and edges', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 0, y: 0 },
          size: { width: 50, height: 50 },
          data: {},
          measuredBounds: { x: 0, y: 0, width: 50, height: 50 },
        },
        {
          id: 'node-2',
          position: { x: 100, y: 100 },
          size: { width: 50, height: 50 },
          data: {},
          measuredBounds: { x: 100, y: 100, width: 50, height: 50 },
        },
      ];

      const edges: Edge[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
          data: {},
          points: [
            { x: 50, y: 50 },
            { x: 100, y: 100 },
          ],
        },
      ];

      const result = calculatePartsBounds(nodes, edges);

      expect(result).toEqual({
        x: 0,
        y: 0,
        width: 150,
        height: 150,
      });
    });

    it('should handle empty nodes and edges', () => {
      const result = calculatePartsBounds([], []);

      expect(result).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
    });

    it('should handle only nodes', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 50, y: 75 },
          size: { width: 100, height: 80 },
          data: {},
          measuredBounds: { x: 50, y: 75, width: 100, height: 80 },
        },
      ];

      const result = calculatePartsBounds(nodes, []);

      expect(result).toEqual({
        x: 0,
        y: 0,
        width: 150,
        height: 155,
      });
    });

    it('should handle only edges', () => {
      const edges: Edge[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
          data: {},
          points: [
            { x: 10, y: 20 },
            { x: 50, y: 60 },
          ],
        },
      ];

      const result = calculatePartsBounds([], edges);

      expect(result).toEqual({
        x: 0,
        y: 0,
        width: 50,
        height: 60,
      });
    });

    it('should handle nodes without measuredBounds', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 0, y: 0 },
          size: { width: 50, height: 50 },
          data: {},
        },
        {
          id: 'node-2',
          position: { x: 100, y: 100 },
          size: { width: 50, height: 50 },
          data: {},
          measuredBounds: { x: 100, y: 100, width: 50, height: 50 },
        },
      ];

      const edges: Edge[] = [];

      const result = calculatePartsBounds(nodes, edges);

      expect(result).toEqual({
        x: 0,
        y: 0,
        width: 150,
        height: 150,
      });
    });

    it('should handle complex diagram with multiple nodes and edges', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: -50, y: -50 },
          size: { width: 100, height: 100 },
          data: {},
          measuredBounds: { x: -50, y: -50, width: 100, height: 100 },
        },
        {
          id: 'node-2',
          position: { x: 200, y: 200 },
          size: { width: 150, height: 100 },
          data: {},
          measuredBounds: { x: 200, y: 200, width: 150, height: 100 },
        },
      ];

      const edges: Edge[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
          data: {},
          points: [
            { x: 50, y: 0 },
            { x: 100, y: 100 },
            { x: 200, y: 250 },
          ],
        },
        {
          id: 'edge-2',
          source: 'node-2',
          target: 'node-1',
          data: {},
          points: [
            { x: 300, y: 300 },
            { x: 0, y: 50 },
          ],
        },
      ];

      const result = calculatePartsBounds(nodes, edges);

      expect(result).toEqual({
        x: -50,
        y: -50,
        width: 400,
        height: 350,
      });
    });

    it('should handle nodes with rotation', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 50 },
          angle: 45,
          data: {},
          measuredBounds: { x: -3.033, y: -3.033, width: 106.066, height: 106.066 },
        },
      ];

      const result = calculatePartsBounds(nodes, []);

      expect(result.x).toBeCloseTo(-3.033, 1);
      expect(result.y).toBeCloseTo(-3.033, 1);
      expect(result.width).toBeCloseTo(106.066, 1);
      expect(result.height).toBeCloseTo(106.066, 1);
    });

    it('should handle edges with no points', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 10, y: 10 },
          size: { width: 50, height: 50 },
          data: {},
          measuredBounds: { x: 10, y: 10, width: 50, height: 50 },
        },
      ];

      const edges: Edge[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
          data: {},
        },
      ];

      const result = calculatePartsBounds(nodes, edges);

      expect(result).toEqual({
        x: 0,
        y: 0,
        width: 60,
        height: 60,
      });
    });
  });
});
