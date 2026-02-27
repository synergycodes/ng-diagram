import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EdgeRoutingManager } from '../../../../edge-routing-manager';
import { mockEdge } from '../../../../test-utils';
import type { Edge } from '../../../../types';

vi.mock('../../../../utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../utils')>()),
}));

vi.mock('../get-edge-points', () => ({
  getEdgePoints: vi.fn(),
}));

import {
  checkIfShouldRouteEdges,
  createUpdatedTemporaryEdge,
  havePointsChanged,
  processAutoModeEdge,
  processEdgesForRouting,
  processManualModeEdge,
  shouldRouteEdge,
  updateLabelPositions,
} from '../edges-routing';
import { getEdgePoints } from '../get-edge-points';

describe('Edge Routing Helper Functions', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockHelpers: any;
  let mockRoutingManager: Partial<EdgeRoutingManager>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockHelpers = {
      anyEdgesAdded: vi.fn(),
      checkIfAnyNodePropsChanged: vi.fn(),
      checkIfAnyEdgePropsChanged: vi.fn(),
      checkIfMetadataPropsChanged: vi.fn(),
      checkIfEdgeChanged: vi.fn(),
      checkIfNodeChanged: vi.fn(),
      checkIfEdgeAdded: vi.fn(),
    };

    mockRoutingManager = {
      computePointOnPath: vi.fn().mockReturnValue({ x: 50, y: 50 }),
      computePointAtDistance: vi.fn().mockReturnValue({ x: 30, y: 0 }),
      hasRouting: vi.fn().mockReturnValue(true),
      getDefaultRouting: vi.fn().mockReturnValue('polyline'),
    };
  });

  describe('checkIfShouldRouteEdges', () => {
    it('should return true when modelActionType is init', () => {
      const context = {
        modelActionType: 'init',
        modelActionTypes: ['init'],
        helpers: mockHelpers,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const result = checkIfShouldRouteEdges(context);
      expect(result).toBe(true);
    });

    it('should return true when edges are added', () => {
      mockHelpers.anyEdgesAdded = vi.fn().mockReturnValue(true);
      const context = {
        modelActionType: 'addEdges',
        modelActionTypes: ['addEdges'],
        helpers: mockHelpers,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const result = checkIfShouldRouteEdges(context);
      expect(result).toBe(true);
    });

    it('should return true when node properties change', () => {
      mockHelpers.checkIfAnyNodePropsChanged = vi.fn().mockReturnValue(true);
      const context = {
        modelActionType: 'updateNodes',
        modelActionTypes: ['updateNodes'],
        helpers: mockHelpers,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const result = checkIfShouldRouteEdges(context);
      expect(result).toBe(true);
      expect(mockHelpers.checkIfAnyNodePropsChanged).toHaveBeenCalledWith([
        'position',
        'size',
        'angle',
        'measuredPorts',
      ]);
    });

    it('should return true when edge properties change', () => {
      mockHelpers.checkIfAnyEdgePropsChanged = vi.fn().mockReturnValue(true);
      const context = {
        modelActionType: 'updateEdges',
        modelActionTypes: ['updateEdges'],
        helpers: mockHelpers,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const result = checkIfShouldRouteEdges(context);
      expect(result).toBe(true);
      expect(mockHelpers.checkIfAnyEdgePropsChanged).toHaveBeenCalledWith([
        'targetPosition',
        'sourcePosition',
        'points',
        'sourcePort',
        'targetPort',
        'source',
        'target',
        'routing',
        'routingMode',
      ]);
    });

    it('should return false when no relevant changes occurred', () => {
      mockHelpers.anyEdgesAdded = vi.fn().mockReturnValue(false);
      mockHelpers.checkIfAnyNodePropsChanged = vi.fn().mockReturnValue(false);
      mockHelpers.checkIfAnyEdgePropsChanged = vi.fn().mockReturnValue(false);

      const context = {
        modelActionType: 'updateNodes',
        modelActionTypes: ['updateNodes'],
        helpers: mockHelpers,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const result = checkIfShouldRouteEdges(context);
      expect(result).toBe(false);
    });
  });

  describe('shouldRouteEdge', () => {
    it('should return true when edge has changed', () => {
      const edge: Edge = { ...mockEdge, id: 'edge-1' };
      mockHelpers.checkIfEdgeChanged = vi.fn().mockReturnValue(true);

      const result = shouldRouteEdge(edge, mockHelpers, ['updateEdge']);

      expect(result).toBe(true);
      expect(mockHelpers.checkIfEdgeChanged).toHaveBeenCalledWith('edge-1');
    });

    it('should return true when source node has changed', () => {
      const edge: Edge = { ...mockEdge, id: 'edge-1', source: 'node-1' };
      mockHelpers.checkIfEdgeChanged = vi.fn().mockReturnValue(false);
      mockHelpers.checkIfNodeChanged = vi.fn().mockImplementation((id) => id === 'node-1');

      const result = shouldRouteEdge(edge, mockHelpers, ['updateNodes']);

      expect(result).toBe(true);
      expect(mockHelpers.checkIfNodeChanged).toHaveBeenCalledWith('node-1');
    });

    it('should return true when target node has changed', () => {
      const edge: Edge = { ...mockEdge, id: 'edge-1', source: 'node-1', target: 'node-2' };
      mockHelpers.checkIfEdgeChanged = vi.fn().mockReturnValue(false);
      mockHelpers.checkIfNodeChanged = vi.fn().mockImplementation((id) => id === 'node-2');

      const result = shouldRouteEdge(edge, mockHelpers, ['updateNodes']);

      expect(result).toBe(true);
      expect(mockHelpers.checkIfNodeChanged).toHaveBeenCalledWith('node-2');
    });

    it('should return true on init regardless of changes', () => {
      const edge: Edge = { ...mockEdge };
      mockHelpers.checkIfEdgeChanged = vi.fn().mockReturnValue(false);
      mockHelpers.checkIfNodeChanged = vi.fn().mockReturnValue(false);

      const result = shouldRouteEdge(edge, mockHelpers, ['init']);

      expect(result).toBe(true);
    });

    it('should return false when nothing has changed', () => {
      const edge: Edge = { ...mockEdge };
      mockHelpers.checkIfEdgeChanged = vi.fn().mockReturnValue(false);
      mockHelpers.checkIfNodeChanged = vi.fn().mockReturnValue(false);

      const result = shouldRouteEdge(edge, mockHelpers, ['updateNodes']);

      expect(result).toBe(false);
    });

    it('should return true when edge is added programmatically', () => {
      const edge: Edge = { ...mockEdge, id: 'edge-4' };
      mockHelpers.checkIfEdgeAdded = vi.fn().mockReturnValue(true);

      const result = shouldRouteEdge(edge, mockHelpers, ['addEdges']);

      expect(result).toBe(true);
      expect(mockHelpers.checkIfEdgeAdded).toHaveBeenCalledWith('edge-4');
    });
  });

  describe('havePointsChanged', () => {
    it('should return true when old points are undefined', () => {
      const newPoints = [{ x: 10, y: 10 }];
      const result = havePointsChanged(undefined, newPoints);
      expect(result).toBe(true);
    });

    it('should return true when lengths differ', () => {
      const oldPoints = [{ x: 10, y: 10 }];
      const newPoints = [
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ];

      const result = havePointsChanged(oldPoints, newPoints);
      expect(result).toBe(true);
    });

    it('should return true when points differ', () => {
      const oldPoints = [
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ];
      const newPoints = [
        { x: 10, y: 10 },
        { x: 30, y: 30 },
      ];

      const result = havePointsChanged(oldPoints, newPoints);
      expect(result).toBe(true);
    });

    it('should return false when points are the same', () => {
      const oldPoints = [
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ];
      const newPoints = [
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ];

      const result = havePointsChanged(oldPoints, newPoints);
      expect(result).toBe(false);
    });

    it('should handle empty arrays', () => {
      const result = havePointsChanged([], []);
      expect(result).toBe(false);
    });
  });

  describe('updateLabelPositions', () => {
    it('should update all label positions', () => {
      const edge: Edge = {
        ...mockEdge,
        routing: 'polyline',
        measuredLabels: [
          { id: 'label-1', positionOnEdge: 0.25 },
          { id: 'label-2', positionOnEdge: 0.75 },
        ],
      };
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];

      mockRoutingManager.computePointOnPath = vi
        .fn()
        .mockReturnValueOnce({ x: 25, y: 25 })
        .mockReturnValueOnce({ x: 75, y: 75 });

      const result = updateLabelPositions(edge, points, mockRoutingManager as EdgeRoutingManager);

      expect(result).toHaveLength(2);
      expect(result![0]).toEqual({
        id: 'label-1',
        positionOnEdge: 0.25,
        position: { x: 25, y: 25 },
      });
      expect(result![1]).toEqual({
        id: 'label-2',
        positionOnEdge: 0.75,
        position: { x: 75, y: 75 },
      });

      expect(mockRoutingManager.computePointOnPath).toHaveBeenCalledTimes(2);
      expect(mockRoutingManager.computePointOnPath).toHaveBeenCalledWith('polyline', points, 0.25);
      expect(mockRoutingManager.computePointOnPath).toHaveBeenCalledWith('polyline', points, 0.75);
    });

    it('should return undefined when edge has no labels', () => {
      const edge: Edge = {
        ...mockEdge,
        measuredLabels: undefined,
      };
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];

      const result = updateLabelPositions(edge, points, mockRoutingManager as EdgeRoutingManager);

      expect(result).toBeUndefined();
      expect(mockRoutingManager.computePointOnPath).not.toHaveBeenCalled();
    });

    it('should handle empty labels array', () => {
      const edge: Edge = {
        ...mockEdge,
        measuredLabels: [],
      };
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];

      const result = updateLabelPositions(edge, points, mockRoutingManager as EdgeRoutingManager);

      expect(result).toEqual([]);
    });

    it('should use computePointAtDistance for absolute (px) label positions', () => {
      const edge: Edge = {
        ...mockEdge,
        routing: 'polyline',
        measuredLabels: [{ id: 'label-abs', positionOnEdge: '30px' }],
      };
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];

      mockRoutingManager.computePointAtDistance = vi.fn().mockReturnValue({ x: 30, y: 0 });

      const result = updateLabelPositions(edge, points, mockRoutingManager as EdgeRoutingManager);

      expect(result).toHaveLength(1);
      expect(result![0]).toEqual({
        id: 'label-abs',
        positionOnEdge: '30px',
        position: { x: 30, y: 0 },
      });
      expect(mockRoutingManager.computePointAtDistance).toHaveBeenCalledWith('polyline', points, 30);
      expect(mockRoutingManager.computePointOnPath).not.toHaveBeenCalled();
    });

    it('should handle negative absolute positions (from target)', () => {
      const edge: Edge = {
        ...mockEdge,
        routing: 'polyline',
        measuredLabels: [{ id: 'label-neg', positionOnEdge: '-20px' }],
      };
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];

      mockRoutingManager.computePointAtDistance = vi.fn().mockReturnValue({ x: 80, y: 0 });

      const result = updateLabelPositions(edge, points, mockRoutingManager as EdgeRoutingManager);

      expect(result![0].position).toEqual({ x: 80, y: 0 });
      expect(mockRoutingManager.computePointAtDistance).toHaveBeenCalledWith('polyline', points, -20);
    });

    it('should handle mixed relative and absolute label positions', () => {
      const edge: Edge = {
        ...mockEdge,
        routing: 'polyline',
        measuredLabels: [
          { id: 'label-rel', positionOnEdge: 0.5 },
          { id: 'label-abs', positionOnEdge: '20px' },
        ],
      };
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];

      mockRoutingManager.computePointOnPath = vi.fn().mockReturnValue({ x: 50, y: 0 });
      mockRoutingManager.computePointAtDistance = vi.fn().mockReturnValue({ x: 20, y: 0 });

      const result = updateLabelPositions(edge, points, mockRoutingManager as EdgeRoutingManager);

      expect(result).toHaveLength(2);
      expect(result![0].position).toEqual({ x: 50, y: 0 });
      expect(result![1].position).toEqual({ x: 20, y: 0 });
      expect(mockRoutingManager.computePointOnPath).toHaveBeenCalledWith('polyline', points, 0.5);
      expect(mockRoutingManager.computePointAtDistance).toHaveBeenCalledWith('polyline', points, 20);
    });
  });

  describe('processManualModeEdge', () => {
    it('should return edge update with labels when labels exist', () => {
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        measuredLabels: [{ id: 'label-1', positionOnEdge: 0.5 }],
      };
      const sourcePoint = { x: 0, y: 0 };
      const targetPoint = { x: 100, y: 100 };
      const points = [sourcePoint, targetPoint];

      mockRoutingManager.computePointOnPath = vi.fn().mockReturnValue({ x: 50, y: 50 });

      const result = processManualModeEdge(
        edge,
        sourcePoint,
        targetPoint,
        points,
        mockRoutingManager as EdgeRoutingManager
      );

      expect(result).toEqual({
        id: 'edge-1',
        sourcePosition: sourcePoint,
        targetPosition: targetPoint,
        measuredLabels: [{ id: 'label-1', positionOnEdge: 0.5, position: { x: 50, y: 50 } }],
      });
    });

    it('should return edge update with positions when only positions exist', () => {
      const edge: Edge = { ...mockEdge, id: 'edge-1' };
      const sourcePoint = { x: 10, y: 10 };
      const targetPoint = undefined;
      const points = [
        { x: 10, y: 10 },
        { x: 50, y: 50 },
      ];

      const result = processManualModeEdge(
        edge,
        sourcePoint,
        targetPoint,
        points,
        mockRoutingManager as EdgeRoutingManager
      );

      expect(result).toEqual({
        id: 'edge-1',
        sourcePosition: sourcePoint,
        targetPosition: targetPoint,
        measuredLabels: undefined,
      });
    });

    it('should return null when no updates needed', () => {
      const edge: Edge = { ...mockEdge, id: 'edge-1' };
      const points = [{ x: 10, y: 10 }];

      const result = processManualModeEdge(
        edge,
        undefined,
        undefined,
        points,
        mockRoutingManager as EdgeRoutingManager
      );

      expect(result).toBeNull();
    });
  });

  describe('processAutoModeEdge', () => {
    it('should return edge update when points have changed', () => {
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        points: [{ x: 0, y: 0 }], // Different from new points
      };
      const sourcePoint = { x: 10, y: 10 };
      const targetPoint = { x: 90, y: 90 };
      const newPoints = [
        { x: 10, y: 10 },
        { x: 90, y: 90 },
      ];

      const result = processAutoModeEdge(
        edge,
        sourcePoint,
        targetPoint,
        newPoints,
        mockRoutingManager as EdgeRoutingManager
      );

      expect(result).toEqual({
        id: 'edge-1',
        points: newPoints,
        sourcePosition: sourcePoint,
        targetPosition: targetPoint,
        measuredLabels: undefined,
      });
    });

    it('should return null when points have not changed and all labels are positioned', () => {
      const points = [
        { x: 10, y: 10 },
        { x: 90, y: 90 },
      ];
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        points: points,
        measuredLabels: [{ id: 'label-1', positionOnEdge: 0.5, position: { x: 50, y: 50 } }],
      };

      const result = processAutoModeEdge(
        edge,
        { x: 10, y: 10 },
        { x: 90, y: 90 },
        points,
        mockRoutingManager as EdgeRoutingManager
      );

      expect(result).toBeNull();
    });

    it('should return null when points have not changed and edge has no labels', () => {
      const points = [
        { x: 10, y: 10 },
        { x: 90, y: 90 },
      ];
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        points: points,
      };

      const result = processAutoModeEdge(
        edge,
        { x: 10, y: 10 },
        { x: 90, y: 90 },
        points,
        mockRoutingManager as EdgeRoutingManager
      );

      expect(result).toBeNull();
    });

    it('should update labels when points change', () => {
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        points: undefined,
        measuredLabels: [{ id: 'label-1', positionOnEdge: 0.5 }],
      };
      const newPoints = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];

      mockRoutingManager.computePointOnPath = vi.fn().mockReturnValue({ x: 50, y: 50 });

      const result = processAutoModeEdge(
        edge,
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        newPoints,
        mockRoutingManager as EdgeRoutingManager
      );

      expect(result).toEqual({
        id: 'edge-1',
        points: newPoints,
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 100, y: 100 },
        measuredLabels: [{ id: 'label-1', positionOnEdge: 0.5, position: { x: 50, y: 50 } }],
      });
    });

    it('should update labels with undefined position even when points have not changed', () => {
      const points = [
        { x: 10, y: 10 },
        { x: 90, y: 90 },
      ];
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        points: points,
        measuredLabels: [{ id: 'label-1', positionOnEdge: 0.5 }],
      };

      mockRoutingManager.computePointOnPath = vi.fn().mockReturnValue({ x: 50, y: 50 });

      const result = processAutoModeEdge(
        edge,
        { x: 10, y: 10 },
        { x: 90, y: 90 },
        points,
        mockRoutingManager as EdgeRoutingManager
      );

      expect(result).toEqual({
        id: 'edge-1',
        sourcePosition: { x: 10, y: 10 },
        targetPosition: { x: 90, y: 90 },
        measuredLabels: [{ id: 'label-1', positionOnEdge: 0.5, position: { x: 50, y: 50 } }],
      });
      expect(result!.points).toBeUndefined();
    });

    it('should update labels with NaN position even when points have not changed', () => {
      const points = [
        { x: 10, y: 10 },
        { x: 90, y: 90 },
      ];
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        points: points,
        measuredLabels: [{ id: 'label-1', positionOnEdge: 0.5, position: { x: NaN, y: 0 } }],
      };

      mockRoutingManager.computePointOnPath = vi.fn().mockReturnValue({ x: 50, y: 50 });

      const result = processAutoModeEdge(
        edge,
        { x: 10, y: 10 },
        { x: 90, y: 90 },
        points,
        mockRoutingManager as EdgeRoutingManager
      );

      expect(result).not.toBeNull();
      expect(result!.measuredLabels![0].position).toEqual({ x: 50, y: 50 });
    });

    it('should update labels with null position even when points have not changed', () => {
      const points = [
        { x: 10, y: 10 },
        { x: 90, y: 90 },
      ];
      const edge: Edge = {
        ...mockEdge,
        id: 'edge-1',
        points: points,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        measuredLabels: [{ id: 'label-1', positionOnEdge: 0.5, position: null as any }],
      };

      mockRoutingManager.computePointOnPath = vi.fn().mockReturnValue({ x: 50, y: 50 });

      const result = processAutoModeEdge(
        edge,
        { x: 10, y: 10 },
        { x: 90, y: 90 },
        points,
        mockRoutingManager as EdgeRoutingManager
      );

      expect(result).not.toBeNull();
      expect(result!.measuredLabels![0].position).toEqual({ x: 50, y: 50 });
    });
  });

  describe('processEdgesForRouting', () => {
    beforeEach(() => {
      vi.mocked(getEdgePoints).mockImplementation((edge) => ({
        sourcePoint: { x: 0, y: 0 },
        targetPoint: { x: 100, y: 100 },
        points:
          edge.routingMode === 'manual'
            ? edge.points || [
                { x: 0, y: 0 },
                { x: 100, y: 100 },
              ]
            : [
                { x: 0, y: 0 },
                { x: 100, y: 100 },
              ],
      }));
    });

    it('should process multiple edges with different routing modes', () => {
      const edges: Edge[] = [
        { ...mockEdge, id: 'auto-edge', routingMode: 'auto', points: [] }, // Empty points so they get updated
        { ...mockEdge, id: 'manual-edge', routingMode: 'manual', points: [{ x: 50, y: 50 }] },
      ];
      const nodesMap = new Map();

      mockHelpers.checkIfEdgeChanged = vi.fn().mockReturnValue(true);
      mockHelpers.checkIfNodeChanged = vi.fn().mockReturnValue(false);

      const result = processEdgesForRouting(edges, nodesMap, mockRoutingManager as EdgeRoutingManager, mockHelpers, [
        'updateEdge',
      ]);

      expect(result).toHaveLength(2);
      expect(result![0]).toMatchObject({ id: 'auto-edge', points: expect.any(Array) });
      expect(result![1]).toMatchObject({ id: 'manual-edge' });
      expect(result![1].points).toBeUndefined(); // Manual mode doesn't update points
    });

    it('should skip edges that should not be routed', () => {
      const edges: Edge[] = [
        { ...mockEdge, id: 'edge-1', points: [] }, // Empty points so update is generated
        { ...mockEdge, id: 'edge-2', points: [] },
      ];
      const nodesMap = new Map();

      mockHelpers.checkIfEdgeChanged = vi.fn().mockImplementation((id) => id === 'edge-1');
      mockHelpers.checkIfNodeChanged = vi.fn().mockReturnValue(false);

      const result = processEdgesForRouting(edges, nodesMap, mockRoutingManager as EdgeRoutingManager, mockHelpers, [
        'updateEdge',
      ]);

      expect(result).toHaveLength(1);
      expect(result![0].id).toBe('edge-1');
    });

    it('should handle empty edges array', () => {
      const result = processEdgesForRouting([], new Map(), mockRoutingManager as EdgeRoutingManager, mockHelpers, [
        'init',
      ]);

      expect(result).toEqual([]);
    });
  });

  describe('createUpdatedTemporaryEdge', () => {
    beforeEach(() => {
      vi.mocked(getEdgePoints).mockReturnValue({
        sourcePoint: { x: 10, y: 10 },
        targetPoint: { x: 90, y: 90 },
        points: [
          { x: 10, y: 10 },
          { x: 50, y: 50 },
          { x: 90, y: 90 },
        ],
      });
    });

    it('should create updated temporary edge with new points and computedZIndex', () => {
      const temporaryEdge: Edge = {
        ...mockEdge,
        id: 'temp-edge',
        temporary: true,
        points: [],
      };
      const nodesMap = new Map();
      const zIndex = 1000;

      const result = createUpdatedTemporaryEdge(
        temporaryEdge,
        nodesMap,
        mockRoutingManager as EdgeRoutingManager,
        zIndex
      );

      expect(result).toEqual({
        ...temporaryEdge,
        points: [
          { x: 10, y: 10 },
          { x: 50, y: 50 },
          { x: 90, y: 90 },
        ],
        sourcePosition: { x: 10, y: 10 },
        targetPosition: { x: 90, y: 90 },
        computedZIndex: 1000,
      });
    });

    it('should preserve other edge properties', () => {
      const temporaryEdge: Edge = {
        ...mockEdge,
        id: 'temp-edge',
        temporary: true,
        data: { custom: 'data' },
        type: 'custom-edge',
        routing: 'bezier',
      };

      const result = createUpdatedTemporaryEdge(
        temporaryEdge,
        new Map(),
        mockRoutingManager as EdgeRoutingManager,
        500
      );

      expect(result.data).toEqual({ custom: 'data' });
      expect(result.type).toBe('custom-edge');
      expect(result.routing).toBe('bezier');
      expect(result.computedZIndex).toBe(500);
    });
  });
});
