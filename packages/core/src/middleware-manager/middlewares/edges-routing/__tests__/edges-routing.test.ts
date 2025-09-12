import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EdgeRoutingManager } from '../../../../edge-routing-manager';
import { FlowCore } from '../../../../flow-core';
import { mockEdge, mockMetadata, mockNode } from '../../../../test-utils';
import type {
  Edge,
  FlowState,
  Metadata,
  MiddlewareContext,
  MiddlewaresConfigFromMiddlewares,
  Point,
} from '../../../../types';
import { DEFAULT_SELECTED_Z_INDEX } from '../../z-index-assignment/constants';
import { edgesRoutingMiddleware, EdgesRoutingMiddlewareMetadata } from '../edges-routing';

vi.mock('../get-edge-points', () => ({
  getEdgePoints: vi.fn().mockImplementation((edge) => {
    const sourcePoint = edge.sourcePosition || { x: 100, y: 100 };
    const targetPoint = edge.targetPosition || { x: 200, y: 200 };
    const points = edge.routingMode === 'manual' && edge.points?.length > 0 ? edge.points : [sourcePoint, targetPoint];

    return { sourcePoint, targetPoint, points };
  }),
}));

vi.mock('../../../../utils', () => ({
  isSamePoint: (point1: Point, point2: Point) => point1.x === point2.x && point1.y === point2.y,
}));

describe('Edges Routing Middleware', () => {
  let initialState: FlowState;
  let context: MiddlewareContext<[], Metadata<MiddlewaresConfigFromMiddlewares<[]>>, EdgesRoutingMiddlewareMetadata>;
  const nextMock = vi.fn();
  const anyEdgesAddedMock = vi.fn();
  const checkIfAnyNodePropsChangedMock = vi.fn();
  const checkIfAnyEdgePropsChangedMock = vi.fn();
  const checkIfMetadataPropsChangedMock = vi.fn();
  const checkIfEdgeChangedMock = vi.fn();
  const checkIfNodeChangedMock = vi.fn();

  const mockRoutingManager: Partial<EdgeRoutingManager> = {
    hasRouting: vi.fn().mockReturnValue(true),
    computePoints: vi.fn().mockImplementation((_routing, context) => {
      if (!context?.sourcePoint || !context?.targetPoint) return [];
      return [
        { x: context.sourcePoint.x, y: context.sourcePoint.y },
        { x: context.targetPoint.x, y: context.targetPoint.y },
      ];
    }),
    computePointOnPath: vi.fn().mockReturnValue({ x: 50, y: 50 }),
    getDefaultRouting: vi.fn().mockReturnValue('orthogonal'),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    flowCore = {
      edgeRoutingManager: mockRoutingManager,
    } as unknown as FlowCore;

    initialState = {
      nodes: [mockNode],
      edges: [mockEdge],
      metadata: mockMetadata,
    };

    context = {
      state: initialState,
      initialState,
      nodesMap: new Map(),
      edgesMap: new Map(),
      modelActionType: 'addNodes',
      helpers: {
        anyEdgesAdded: anyEdgesAddedMock,
        checkIfAnyNodePropsChanged: checkIfAnyNodePropsChangedMock,
        checkIfAnyEdgePropsChanged: checkIfAnyEdgePropsChangedMock,
        checkIfMetadataPropsChanged: checkIfMetadataPropsChangedMock,
        checkIfEdgeChanged: checkIfEdgeChangedMock,
        checkIfNodeChanged: checkIfNodeChangedMock,
      },
      history: [],
      initialUpdate: {},
      middlewareMetadata: {
        enabled: true,
        temporaryEdgeZIndex: DEFAULT_SELECTED_Z_INDEX,
      },
    } as unknown as MiddlewareContext<
      [],
      Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
      EdgesRoutingMiddlewareMetadata
    >;
  });

  describe('Middleware Execution Control', () => {
    it('should exit early when middleware is disabled', () => {
      context.middlewareMetadata.enabled = false;

      edgesRoutingMiddleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalledWith();
      expect(checkIfAnyNodePropsChangedMock).not.toHaveBeenCalled();
    });

    it('should exit when no routing is needed', () => {
      anyEdgesAddedMock.mockReturnValue(false);
      checkIfAnyNodePropsChangedMock.mockReturnValue(false);
      checkIfAnyEdgePropsChangedMock.mockReturnValue(false);
      checkIfMetadataPropsChangedMock.mockReturnValue(false);

      edgesRoutingMiddleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalledWith();
    });

    it('should proceed when edges need routing on init', () => {
      context.modelActionType = 'init';

      edgesRoutingMiddleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalled();
    });

    it('should proceed when node properties change', () => {
      checkIfAnyNodePropsChangedMock.mockReturnValue(true);
      checkIfEdgeChangedMock.mockReturnValue(true);

      edgesRoutingMiddleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalled();
    });
  });

  describe('Edge Processing', () => {
    it('should process edges in auto mode and update points', () => {
      const newState = {
        nodes: [
          { ...mockNode, id: 'node-1', position: { x: 50, y: 50 } },
          { ...mockNode, id: 'node-2', position: { x: 200, y: 200 } },
        ],
        edges: [
          {
            ...mockEdge,
            id: 'auto-edge',
            source: 'node-1',
            target: 'node-2',
            routingMode: 'auto' as const,
            points: [], // Empty points should be computed
          },
        ],
        metadata: mockMetadata,
      };

      context = {
        ...context,
        state: newState,
        modelActionType: 'init',
        nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
      };

      edgesRoutingMiddleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalledWith({
        edgesToUpdate: [
          expect.objectContaining({
            id: 'auto-edge',
            points: expect.any(Array),
          }),
        ],
      });
    });

    it('should process edges in manual mode without updating points', () => {
      const manualPoints = [
        { x: 100, y: 100 },
        { x: 150, y: 150 },
        { x: 200, y: 200 },
      ];

      const newState = {
        nodes: [
          { ...mockNode, id: 'node-1', position: { x: 50, y: 50 } },
          { ...mockNode, id: 'node-2', position: { x: 200, y: 200 } },
        ],
        edges: [
          {
            ...mockEdge,
            id: 'manual-edge',
            source: 'node-1',
            target: 'node-2',
            routingMode: 'manual' as const,
            points: manualPoints,
          },
        ],
        metadata: mockMetadata,
      };

      context = {
        ...context,
        state: newState,
        modelActionType: 'init',
        nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
      };

      edgesRoutingMiddleware.execute(context, nextMock, () => null);

      const callArgs = nextMock.mock.calls[0][0];
      const edgeUpdate = callArgs?.edgesToUpdate?.find((e: Edge) => e.id === 'manual-edge');

      // Points should not be updated in manual mode
      expect(edgeUpdate?.points).toBeUndefined();
      // But source and target positions should be set
      expect(edgeUpdate?.sourcePosition).toBeDefined();
      expect(edgeUpdate?.targetPosition).toBeDefined();
    });

    it('should skip edges that have not changed', () => {
      const newState = {
        nodes: [
          { ...mockNode, id: 'node-1', position: { x: 50, y: 50 } },
          { ...mockNode, id: 'node-2', position: { x: 200, y: 200 } },
        ],
        edges: [
          {
            ...mockEdge,
            id: 'unchanged-edge',
            source: 'node-1',
            target: 'node-2',
            points: [
              { x: 50, y: 50 },
              { x: 200, y: 200 },
            ],
          },
        ],
        metadata: mockMetadata,
      };

      context = {
        ...context,
        state: newState,
        modelActionType: 'updateNodes',
        nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
      };

      checkIfAnyNodePropsChangedMock.mockReturnValue(true);
      checkIfEdgeChangedMock.mockReturnValue(false);
      checkIfNodeChangedMock.mockReturnValue(false);

      edgesRoutingMiddleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalledWith({});
    });

    it('should not update points if they have not changed in auto mode', () => {
      const existingPoints = [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
      ];

      const newState = {
        nodes: [
          { ...mockNode, id: 'node-1', position: { x: 100, y: 100 } },
          { ...mockNode, id: 'node-2', position: { x: 200, y: 200 } },
        ],
        edges: [
          {
            ...mockEdge,
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            sourcePosition: { x: 100, y: 100 },
            targetPosition: { x: 200, y: 200 },
            points: existingPoints,
          },
        ],
        metadata: mockMetadata,
      };

      context = {
        ...context,
        state: newState,
        modelActionType: 'init',
        nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
      };

      edgesRoutingMiddleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalledWith({});
    });
  });

  describe('Label Processing', () => {
    it('should update edge label positions', () => {
      const newState = {
        nodes: [
          { ...mockNode, id: 'node-1', position: { x: 100, y: 100 } },
          { ...mockNode, id: 'node-2', position: { x: 200, y: 200 } },
        ],
        edges: [
          {
            ...mockEdge,
            id: 'edge-with-labels',
            source: 'node-1',
            target: 'node-2',
            points: [],
            labels: [
              { id: 'label-1', positionOnEdge: 0.5 },
              { id: 'label-2', positionOnEdge: 0.25 },
            ],
          },
        ],
        metadata: mockMetadata,
      };

      context = {
        ...context,
        state: newState,
        modelActionType: 'init',
        nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
      };

      edgesRoutingMiddleware.execute(context, nextMock, () => null);

      const callArgs = nextMock.mock.calls[0][0];
      const edgeUpdate = callArgs?.edgesToUpdate?.find((e: Edge) => e.id === 'edge-with-labels');

      expect(edgeUpdate?.labels).toHaveLength(2);
      expect(edgeUpdate?.labels?.[0]).toMatchObject({
        id: 'label-1',
        positionOnEdge: 0.5,
        position: { x: 50, y: 50 },
      });
    });

    it('should update labels in manual mode without changing points', () => {
      const manualPoints = [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
      ];

      const newState = {
        nodes: [
          { ...mockNode, id: 'node-1' },
          { ...mockNode, id: 'node-2' },
        ],
        edges: [
          {
            ...mockEdge,
            id: 'manual-edge-with-labels',
            source: 'node-1',
            target: 'node-2',
            routingMode: 'manual' as const,
            points: manualPoints,
            labels: [{ id: 'label-1', positionOnEdge: 0.5 }],
          },
        ],
        metadata: mockMetadata,
      };

      context = {
        ...context,
        state: newState,
        modelActionType: 'init',
        nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
      };

      edgesRoutingMiddleware.execute(context, nextMock, () => null);

      const callArgs = nextMock.mock.calls[0][0];
      const edgeUpdate = callArgs?.edgesToUpdate?.find((e: Edge) => e.id === 'manual-edge-with-labels');

      expect(edgeUpdate?.points).toBeUndefined(); // Points not updated in manual mode
      expect(edgeUpdate?.labels).toBeDefined();
      expect(edgeUpdate?.labels?.[0]?.position).toBeDefined();
    });
  });

  describe('Temporary Edge Processing', () => {
    it('should process temporary edge', () => {
      const newState = {
        ...initialState,
        nodes: [{ ...mockNode, id: 'node-1', position: { x: 100, y: 100 } }],
        metadata: {
          ...mockMetadata,
          temporaryEdge: {
            ...mockEdge,
            id: 'temp-edge',
            source: 'node-1',
            target: '',
            targetPosition: { x: 200, y: 200 },
            points: [],
          },
        },
      };

      context = {
        ...context,
        state: newState,
        modelActionType: 'moveTemporaryEdge',
        nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
      };

      checkIfMetadataPropsChangedMock.mockReturnValue(true);

      edgesRoutingMiddleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalledWith({
        metadataUpdate: {
          temporaryEdge: expect.objectContaining({
            id: 'temp-edge',
            points: expect.any(Array),
            zIndex: DEFAULT_SELECTED_Z_INDEX,
          }),
        },
      });
    });

    it('should use custom temporary edge z-index when provided', () => {
      const customZIndex = 9999;
      context.middlewareMetadata.temporaryEdgeZIndex = customZIndex;

      const newState = {
        ...initialState,
        metadata: {
          ...mockMetadata,
          temporaryEdge: {
            ...mockEdge,
            id: 'temp-edge',
            source: 'node-1',
            targetPosition: { x: 200, y: 200 },
          },
        },
      };

      context.state = newState;
      checkIfMetadataPropsChangedMock.mockReturnValue(true);

      edgesRoutingMiddleware.execute(context, nextMock, () => null);

      const callArgs = nextMock.mock.calls[0][0];
      expect(callArgs?.metadataUpdate?.temporaryEdge?.zIndex).toBe(customZIndex);
    });

    it('should not process temporary edge if metadata has not changed', () => {
      const newState = {
        ...initialState,
        metadata: {
          ...mockMetadata,
          temporaryEdge: mockEdge,
        },
      };

      context = {
        ...context,
        state: newState,
        modelActionType: 'updateNodes',
      };

      checkIfMetadataPropsChangedMock.mockReturnValue(false);
      checkIfAnyNodePropsChangedMock.mockReturnValue(false);
      checkIfAnyEdgePropsChangedMock.mockReturnValue(false);
      anyEdgesAddedMock.mockReturnValue(false);

      edgesRoutingMiddleware.execute(context, nextMock, () => null);

      expect(nextMock).toHaveBeenCalledWith();
    });
  });

  describe('Edge Routing Modes', () => {
    it('should default to auto mode when routingMode is not specified', () => {
      const newState = {
        nodes: [
          { ...mockNode, id: 'node-1' },
          { ...mockNode, id: 'node-2' },
        ],
        edges: [
          {
            ...mockEdge,
            id: 'default-mode-edge',
            source: 'node-1',
            target: 'node-2',
            // routingMode not specified
            points: [],
          },
        ],
        metadata: mockMetadata,
      };

      context = {
        ...context,
        state: newState,
        modelActionType: 'init',
        nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
      };

      edgesRoutingMiddleware.execute(context, nextMock, () => null);

      const callArgs = nextMock.mock.calls[0][0];
      const edgeUpdate = callArgs?.edgesToUpdate?.find((e: Edge) => e.id === 'default-mode-edge');

      // Should update points like auto mode
      expect(edgeUpdate?.points).toBeDefined();
    });

    it('should handle mixed routing modes in multiple edges', () => {
      const newState = {
        nodes: [
          { ...mockNode, id: 'node-1' },
          { ...mockNode, id: 'node-2' },
          { ...mockNode, id: 'node-3' },
        ],
        edges: [
          {
            ...mockEdge,
            id: 'auto-edge',
            source: 'node-1',
            target: 'node-2',
            routingMode: 'auto' as const,
            points: [],
          },
          {
            ...mockEdge,
            id: 'manual-edge',
            source: 'node-2',
            target: 'node-3',
            routingMode: 'manual' as const,
            points: [
              { x: 100, y: 100 },
              { x: 200, y: 200 },
            ],
          },
        ],
        metadata: mockMetadata,
      };

      context = {
        ...context,
        state: newState,
        modelActionType: 'init',
        nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
      };

      edgesRoutingMiddleware.execute(context, nextMock, () => null);

      const callArgs = nextMock.mock.calls[0][0];
      const autoEdgeUpdate = callArgs?.edgesToUpdate?.find((e: Edge) => e.id === 'auto-edge');
      const manualEdgeUpdate = callArgs?.edgesToUpdate?.find((e: Edge) => e.id === 'manual-edge');

      expect(autoEdgeUpdate?.points).toBeDefined();
      expect(manualEdgeUpdate?.points).toBeUndefined();
    });
  });
});
