import { describe, expect, it, vi } from 'vitest';
import { mockEdge, mockNode, mockPort } from '../../../../test-utils';
import { Edge, Node, PortSide } from '../../../../types';
import { getPoint, getSourceTargetPositions } from '../get-source-target-positions';

vi.mock('../../../../utils', () => ({
  getPortFlowPositionSide: vi.fn().mockImplementation((node: Node, portId: string) => {
    const port = node.ports?.find((p) => p.id === portId);
    if (!port) return null;

    // Simulate rotation handling
    let side = port.side;
    if (node.angle === 90) {
      const rotationMap: Record<string, PortSide> = {
        top: 'right',
        right: 'bottom',
        bottom: 'left',
        left: 'top',
      };
      side = rotationMap[port.side];
    }

    return {
      x: node.position.x + (port.position?.x ?? 0) + (port.size?.width ?? 0) / 2,
      y: node.position.y + (port.position?.y ?? 0) + (port.size?.height ?? 0) / 2,
      side,
    };
  }),
}));

vi.mock('../../../../utils/compute-floating-edge-side', () => ({
  computeFloatingEndSide: vi.fn().mockImplementation((node, _portId, cursorPosition) => {
    // Simple mock that returns different sides based on cursor position relative to a fixed point
    if (!node) return 'left';
    const nodeCenter = {
      x: node.position.x + 50,
      y: node.position.y + 25,
    };
    const dx = cursorPosition.x - nodeCenter.x;
    const dy = cursorPosition.y - nodeCenter.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'left' : 'right';
    } else {
      return dy > 0 ? 'top' : 'bottom';
    }
  }),
}));

describe('getSourceTargetPositions', () => {
  it('should return source and target positions for edge with nodes', () => {
    const edge: Edge = {
      ...mockEdge,
      source: 'node-1',
      target: 'node-2',
    };

    const nodesMap = new Map<string, Node>([
      ['node-1', { ...mockNode, id: 'node-1', position: { x: 0, y: 0 } }],
      ['node-2', { ...mockNode, id: 'node-2', position: { x: 100, y: 100 } }],
    ]);

    const result = getSourceTargetPositions(edge, nodesMap);

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('side', 'right');
    expect(result[1]).toHaveProperty('side', 'left');
  });

  it('should use edge positions when nodes are not found', () => {
    const edge: Edge = {
      ...mockEdge,
      source: 'missing-node',
      target: 'missing-node-2',
      sourcePosition: { x: 10, y: 20 },
      targetPosition: { x: 30, y: 40 },
    };

    const nodesMap = new Map<string, Node>();

    const result = getSourceTargetPositions(edge, nodesMap);

    expect(result).toEqual([
      { x: 10, y: 20, side: 'right' },
      { x: 30, y: 40, side: 'left' },
    ]);
  });

  it('should handle edge with ports', () => {
    const edge: Edge = {
      ...mockEdge,
      source: 'node-1',
      target: 'node-2',
      sourcePort: 'port-1',
      targetPort: 'port-2',
    };

    const nodesMap = new Map<string, Node>([
      [
        'node-1',
        {
          ...mockNode,
          id: 'node-1',
          position: { x: 0, y: 0 },
          ports: [
            {
              ...mockPort,
              id: 'port-1',
              side: 'right',
              position: { x: 90, y: 45 },
              size: { width: 10, height: 10 },
            },
          ],
        },
      ],
      [
        'node-2',
        {
          ...mockNode,
          id: 'node-2',
          position: { x: 200, y: 0 },
          ports: [
            {
              ...mockPort,
              id: 'port-2',
              side: 'left',
              position: { x: 0, y: 45 },
              size: { width: 10, height: 10 },
            },
          ],
        },
      ],
    ]);

    const result = getSourceTargetPositions(edge, nodesMap);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ x: 95, y: 50, side: 'right' });
    expect(result[1]).toEqual({ x: 205, y: 50, side: 'left' });
  });

  it('should handle rotated nodes with ports', () => {
    const edge: Edge = {
      ...mockEdge,
      source: 'node-1',
      target: 'node-2',
      sourcePort: 'port-1',
      targetPort: 'port-2',
    };

    const nodesMap = new Map<string, Node>([
      [
        'node-1',
        {
          ...mockNode,
          id: 'node-1',
          angle: 90,
          position: { x: 0, y: 0 },
          ports: [
            {
              ...mockPort,
              id: 'port-1',
              side: 'top', // Will become 'right' after rotation
              position: { x: 45, y: 0 },
              size: { width: 10, height: 10 },
            },
          ],
        },
      ],
      [
        'node-2',
        {
          ...mockNode,
          id: 'node-2',
          position: { x: 200, y: 0 },
          ports: [
            {
              ...mockPort,
              id: 'port-2',
              side: 'left',
              position: { x: 0, y: 45 },
              size: { width: 10, height: 10 },
            },
          ],
        },
      ],
    ]);

    const result = getSourceTargetPositions(edge, nodesMap);

    expect(result).toHaveLength(2);
    expect(result[0].side).toBe('right');
    expect(result[1].side).toBe('left');
  });

  describe('temporary edges', () => {
    it('should compute dynamic side for temporary edge with floating target', () => {
      const edge: Edge = {
        ...mockEdge,
        temporary: true,
        source: 'node-1',
        target: '', // No target node
        sourcePort: 'port-1',
        targetPosition: { x: 50, y: 100 }, // Cursor position below the source
      };

      const nodesMap = new Map<string, Node>([
        [
          'node-1',
          {
            ...mockNode,
            id: 'node-1',
            position: { x: 0, y: 0 },
            ports: [
              {
                ...mockPort,
                id: 'port-1',
                side: 'right',
                position: { x: 90, y: 45 },
                size: { width: 10, height: 10 },
              },
            ],
          },
        ],
      ]);

      const result = getSourceTargetPositions(edge, nodesMap);

      expect(result).toHaveLength(2);
      expect(result[0].side).toBe('right'); // Source side remains default
      expect(result[1].side).toBe('top'); // Target side computed dynamically (cursor is below, not to the right)
    });

    it('should compute dynamic side for temporary edge with floating source', () => {
      const edge: Edge = {
        ...mockEdge,
        temporary: true,
        source: '', // No source node
        target: 'node-2',
        sourcePosition: { x: 250, y: -50 }, // Cursor position above the target
        targetPosition: { x: 200, y: 50 },
        targetPort: 'port-2',
      };

      const nodesMap = new Map<string, Node>([
        [
          'node-2',
          {
            ...mockNode,
            id: 'node-2',
            position: { x: 200, y: 0 },
            ports: [
              {
                ...mockPort,
                id: 'port-2',
                side: 'left',
                position: { x: 0, y: 45 },
                size: { width: 10, height: 10 },
              },
            ],
          },
        ],
      ]);

      const result = getSourceTargetPositions(edge, nodesMap);

      expect(result).toHaveLength(2);
      expect(result[0].side).toBe('bottom'); // Source side computed dynamically (cursor is above, not to the left)
      expect(result[1].side).toBe('left'); // Target side remains default
    });

    it('should use default sides for temporary edge without floating ends', () => {
      const edge: Edge = {
        ...mockEdge,
        temporary: true,
        source: 'node-1',
        target: 'node-2',
      };

      const nodesMap = new Map<string, Node>([
        ['node-1', { ...mockNode, id: 'node-1', position: { x: 0, y: 0 } }],
        ['node-2', { ...mockNode, id: 'node-2', position: { x: 100, y: 100 } }],
      ]);

      const result = getSourceTargetPositions(edge, nodesMap);

      expect(result).toHaveLength(2);
      expect(result[0].side).toBe('right'); // Default source side
      expect(result[1].side).toBe('left'); // Default target side
    });

    it('should handle temporary edge with no nodes and positions', () => {
      const edge: Edge = {
        ...mockEdge,
        temporary: true,
        source: '',
        target: '',
        sourcePosition: { x: 50, y: 50 },
        targetPosition: { x: 150, y: 150 },
      };

      const nodesMap = new Map<string, Node>();

      const result = getSourceTargetPositions(edge, nodesMap);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ x: 50, y: 50, side: 'right' });
      expect(result[1]).toEqual({ x: 150, y: 150, side: 'left' });
    });
  });
});

describe('getPoint', () => {
  it('should return port position when port exists', () => {
    const node: Node = {
      ...mockNode,
      position: { x: 100, y: 100 },
      ports: [
        {
          ...mockPort,
          id: 'port-1',
          side: 'right',
          position: { x: 90, y: 45 },
          size: { width: 10, height: 10 },
        },
      ],
    };

    const result = getPoint(node, 'left', 'port-1', { x: 50, y: 50 });

    expect(result).toEqual({ x: 195, y: 150, side: 'right' });
  });

  it('should return fallback position when node is null', () => {
    const result = getPoint(null as unknown as Node, 'right', 'port-1', { x: 25, y: 25 });

    expect(result).toEqual({ x: 25, y: 25, side: 'right' });
  });

  it('should return fallback position when port ID is not provided', () => {
    const node: Node = {
      ...mockNode,
      position: { x: 100, y: 100 },
    };

    const result = getPoint(node, 'bottom', undefined, { x: 30, y: 30 });

    expect(result).toEqual({ x: 30, y: 30, side: 'bottom' });
  });

  it('should handle rotated node ports', () => {
    const node: Node = {
      ...mockNode,
      angle: 90,
      position: { x: 100, y: 100 },
      ports: [
        {
          ...mockPort,
          id: 'port-1',
          side: 'top', // Will become 'right' after 90-degree rotation
          position: { x: 45, y: 0 },
          size: { width: 10, height: 10 },
        },
      ],
    };

    const result = getPoint(node, 'left', 'port-1', undefined);

    // The port side should be rotated from 'top' to 'right'
    expect(result.side).toBe('right');
  });

  it('should use default side when port is not found', () => {
    const node: Node = {
      ...mockNode,
      position: { x: 100, y: 100 },
      ports: [],
    };

    const result = getPoint(node, 'bottom', 'non-existent-port', { x: 15, y: 15 });

    expect(result).toEqual({ x: 15, y: 15, side: 'bottom' });
  });
});
