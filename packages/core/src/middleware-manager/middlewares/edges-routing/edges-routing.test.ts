import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEdge, mockMetadata, mockNode } from '../../../test-utils';
import type {
  Edge,
  FlowState,
  Metadata,
  MiddlewareContext,
  MiddlewaresConfigFromMiddlewares,
  Node,
  Point,
} from '../../../types';
import { edgesRoutingMiddleware, EdgesRoutingMiddlewareMetadata } from '../edges-routing/edges-routing.ts';
import { DEFAULT_SELECTED_Z_INDEX } from '../z-index-assignment/constants.ts';

vi.mock('../../../utils', () => ({
  getPortFlowPositionSide: (node: Node) => {
    // Return port position based on node position
    // Even if no portId is provided, we should return node position as fallback
    return {
      x: node.position.x,
      y: node.position.y,
      side: 'right',
    };
  },
  getPointOnPath: () => ({ x: 50, y: 50 }),
  isSamePoint: (point1: Point, point2: Point) => point1.x === point2.x && point1.y === point2.y,
}));

vi.mock('../../../utils/get-point-on-path/get-point-on-path', () => ({
  getPointOnPath: () => ({ x: 50, y: 50 }),
}));

describe('Edges Routing Middleware', () => {
  let flowCore: FlowCore;
  let initialState: FlowState;
  let context: MiddlewareContext<[], Metadata<MiddlewaresConfigFromMiddlewares<[]>>, EdgesRoutingMiddlewareMetadata>;
  const nextMock = vi.fn();
  const anyEdgesAddedMock = vi.fn();
  const checkIfAnyNodePropsChangedMock = vi.fn();
  const checkIfAnyEdgePropsChangedMock = vi.fn();
  const checkIfMetadataPropsChangedMock = vi.fn();
  const checkIfEdgeChangedMock = vi.fn();
  const checkIfNodeChangedMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    const mockRoutingManager = {
      hasRouting: vi.fn().mockReturnValue(true),
      computePoints: vi.fn().mockImplementation((_routing, context) => {
        // Return mock points based on context
        if (!context?.source || !context?.target) return [];
        return [
          { x: context.source.x, y: context.source.y },
          { x: context.target.x, y: context.target.y },
        ];
      }),
      computePointOnPath: vi.fn().mockReturnValue({ x: 50, y: 50 }),
      getDefaultRouting: vi.fn().mockReturnValue('orthogonal'),
    };

    flowCore = {
      routingManager: mockRoutingManager,
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
      flowCore,
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
      },
    } as unknown as MiddlewareContext<
      [],
      Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
      EdgesRoutingMiddlewareMetadata
    >;
  });

  it('should call next without update if model action and properties changes are not relevant for routing edges and temporary edge', () => {
    anyEdgesAddedMock.mockReturnValue(false);
    checkIfAnyNodePropsChangedMock.mockReturnValue(false);
    checkIfAnyEdgePropsChangedMock.mockReturnValue(false);
    checkIfMetadataPropsChangedMock.mockReturnValue(false);

    edgesRoutingMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledWith();
  });

  it('should call next without update if there are no edges', () => {
    context = {
      ...context,
      modelActionType: 'init',
      state: { ...initialState, edges: [] } as unknown as FlowState<Metadata<MiddlewaresConfigFromMiddlewares<[]>>>,
    };
    anyEdgesAddedMock.mockReturnValue(false);

    edgesRoutingMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledWith({});
  });

  it('should call next without update if there are no edges to route', () => {
    // Update mock to return false for 'custom-routing' AND default routing
    const customRoutingManager = {
      hasRouting: vi.fn().mockImplementation(() => {
        // Return false for both custom-routing and default (simulating no routing available)
        return false;
      }),
      computePoints: vi.fn().mockReturnValue([]),
      computePointOnPath: vi.fn(),
      getDefaultRouting: vi.fn().mockReturnValue('orthogonal'),
    };

    // Create a custom edge with routing that's not registered
    const customEdge = {
      ...mockEdge,
      id: 'custom-edge',
      routing: 'custom-routing',
      points: [
        { x: 10, y: 10 },
        { x: 20, y: 20 },
      ], // Has existing points
    };

    context = {
      ...context,
      modelActionType: 'init',
      state: {
        ...initialState,
        edges: [customEdge],
      } as unknown as FlowState<Metadata<MiddlewaresConfigFromMiddlewares<[]>>>,
      flowCore: { routingManager: customRoutingManager } as unknown as FlowCore,
    };

    edgesRoutingMiddleware.execute(context, nextMock, () => null);

    // Since no routing is available and fallback produces empty points, edge should be updated with empty points
    expect(nextMock).toHaveBeenCalled();
  });

  it('should route only edges with routing set to polyline or orthogonal or undefined. If an edge has a defined type, then sourcePosition, targetPosition, and labels should be set. All other edges should remain unchanged.', () => {
    // Update mock to only return true for known routings
    const mockRoutingManager = {
      hasRouting: vi.fn().mockImplementation((routing) => {
        return routing === 'polyline' || routing === 'orthogonal' || routing === 'bezier';
      }),
      computePoints: vi.fn().mockImplementation((_routing, context) => {
        if (!context?.source || !context?.target) return [];
        return [
          { x: context.source.x, y: context.source.y },
          { x: context.target.x, y: context.target.y },
        ];
      }),
      computePointOnPath: vi.fn().mockReturnValue({ x: 50, y: 50 }),
      getDefaultRouting: vi.fn().mockReturnValue('orthogonal'),
    };

    const newState = {
      nodes: [
        { ...mockNode, id: 'node-1', position: { x: 100, y: 100 } },
        { ...mockNode, id: 'node-2', position: { x: 200, y: 200 } },
        { ...mockNode, id: 'node-3', position: { x: 300, y: 300 } },
      ],

      edges: [
        {
          ...mockEdge,
          points: [],
          id: 'edge-1',
          source: 'node-1',
          sourcePort: 'port-1',
          target: 'node-2',
          targetPort: 'port-2',
          routing: 'custom-routing',
          type: 'custom-routing',
        },
        {
          ...mockEdge,
          points: [],
          id: 'edge-2',
          source: 'node-2',
          sourcePort: 'port-2',
          target: 'node-3',
          targetPort: 'port-3',
          routing: 'polyline',
        },
        {
          ...mockEdge,
          points: [],
          id: 'edge-3',
          source: 'node-3',
          sourcePort: 'port-3',
          target: 'node-1',
          targetPort: 'port-1',
          routing: undefined,
        },
      ],
      metadata: { ...mockMetadata },
    };
    // Setup mocks for this test
    checkIfEdgeChangedMock.mockReturnValue(true);
    checkIfNodeChangedMock.mockReturnValue(true);

    context = {
      ...context,
      state: newState,
      modelActionType: 'init',
      nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
      flowCore: { routingManager: mockRoutingManager } as unknown as FlowCore,
    };

    edgesRoutingMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledWith({
      edgesToUpdate: [
        {
          id: 'edge-1',
          points: [
            { x: 100, y: 100 },
            { x: 200, y: 200 },
          ],
          sourcePosition: { x: 100, y: 100 },
          targetPosition: { x: 200, y: 200 },
          labels: undefined,
        },
        {
          id: 'edge-2',
          points: [
            { x: 200, y: 200 },
            { x: 300, y: 300 },
          ],
          sourcePosition: { x: 200, y: 200 },
          targetPosition: { x: 300, y: 300 },
          labels: undefined,
        },
        {
          id: 'edge-3',
          points: [
            { x: 300, y: 300 },
            { x: 100, y: 100 },
          ],
          sourcePosition: { x: 300, y: 300 },
          targetPosition: { x: 100, y: 100 },
          labels: undefined,
        },
      ],
    });
  });

  it('should route temporary edge', () => {
    const newState = {
      ...initialState,
      nodes: [{ ...mockNode, id: 'node-1', position: { x: 100, y: 100 } }],
      metadata: {
        ...initialState.metadata,
        temporaryEdge: {
          ...mockEdge,
          points: [],
          source: 'node-1',
          sourcePort: 'port-1',
          target: 'node-2',
          targetPort: 'port-2',
          targetPosition: { x: 200, y: 200 },
        },
      },
    };
    context = {
      ...context,
      state: newState,
      modelActionType: 'moveTemporaryEdge',
      nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
    } as unknown as MiddlewareContext<
      [],
      Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
      EdgesRoutingMiddlewareMetadata
    >;

    checkIfMetadataPropsChangedMock.mockReturnValue(true);

    edgesRoutingMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledWith({
      metadataUpdate: {
        temporaryEdge: {
          ...newState.metadata.temporaryEdge,
          points: [
            { x: 100, y: 100 },
            { x: 200, y: 200 },
          ],
          sourcePosition: { x: 100, y: 100 },
          targetPosition: { x: 200, y: 200 },
          zIndex: DEFAULT_SELECTED_Z_INDEX,
        },
      },
    });
  });

  it('should update edge labels', () => {
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
          sourcePort: 'port-1',
          target: 'node-2',
          targetPort: 'port-2',
          points: [],
          labels: [{ id: 'label-1', positionOnEdge: 5 }],
        },
      ],
      metadata: { ...initialState.metadata },
    };
    context = {
      ...context,
      state: newState,
      modelActionType: 'init',
      nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
    } as unknown as MiddlewareContext<
      [],
      Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
      EdgesRoutingMiddlewareMetadata
    >;

    edgesRoutingMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledWith({
      edgesToUpdate: [
        {
          id: 'edge-1',
          points: [
            { x: 100, y: 100 },
            { x: 200, y: 200 },
          ],
          sourcePosition: { x: 100, y: 100 },
          targetPosition: { x: 200, y: 200 },
          labels: [{ id: 'label-1', positionOnEdge: 5, position: { x: 50, y: 50 } }],
        },
      ],
    });
  });

  it('should not route edge if points are the same', () => {
    const newState = {
      nodes: [
        { ...mockNode, id: 'node-1', position: { x: 100, y: 100 } },
        { ...mockNode, id: 'node-2', position: { x: 200, y: 200 } },
      ],
      edges: [
        {
          ...mockEdge,
          source: 'node-1',
          sourcePort: 'port-1',
          target: 'node-2',
          targetPort: 'port-2',
          points: [
            { x: 100, y: 100 },
            { x: 200, y: 200 },
          ],
        },
      ],
      metadata: { ...initialState.metadata },
    };
    context = {
      ...context,
      state: newState,
      modelActionType: 'init',
      nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
    } as unknown as MiddlewareContext<
      [],
      Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
      EdgesRoutingMiddlewareMetadata
    >;

    edgesRoutingMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledWith({});
  });

  it('should not route if edge and source and target nodes are not changed', () => {
    const newState = {
      nodes: [
        { ...mockNode, id: 'node-1', position: { x: 50, y: 50 } },
        { ...mockNode, id: 'node-2', position: { x: 200, y: 200 } },
      ],
      edges: [
        {
          ...mockEdge,
          source: 'node-1',
          sourcePort: 'port-1',
          target: 'node-2',
          targetPort: 'port-2',
          points: [
            { x: 100, y: 100 },
            { x: 200, y: 200 },
          ],
        },
      ],
      metadata: { ...initialState.metadata },
    };
    context = {
      ...context,
      state: newState,
      modelActionType: 'addNodes',
      nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
    } as unknown as MiddlewareContext<
      [],
      Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
      EdgesRoutingMiddlewareMetadata
    >;
    checkIfAnyNodePropsChangedMock.mockReturnValue(true);
    checkIfEdgeChangedMock.mockReturnValue(false);
    checkIfNodeChangedMock.mockReturnValue(false);

    edgesRoutingMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledWith({});
  });

  it('should route if edge has been changed', () => {
    const newState = {
      nodes: [
        { ...mockNode, id: 'node-1', position: { x: 50, y: 50 } },
        { ...mockNode, id: 'node-2', position: { x: 200, y: 200 } },
      ],
      edges: [
        {
          ...mockEdge,
          source: 'node-1',
          sourcePort: 'port-1',
          target: 'node-2',
          targetPort: 'port-2',
          points: [
            { x: 100, y: 100 },
            { x: 200, y: 200 },
          ],
        },
      ],
      metadata: { ...initialState.metadata },
    };
    context = {
      ...context,
      state: newState,
      modelActionType: 'addNodes',
      nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
    } as unknown as MiddlewareContext<
      [],
      Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
      EdgesRoutingMiddlewareMetadata
    >;
    checkIfAnyNodePropsChangedMock.mockReturnValue(true);
    checkIfEdgeChangedMock.mockReturnValue(true);
    checkIfNodeChangedMock.mockReturnValue(false);

    edgesRoutingMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledWith({
      edgesToUpdate: [
        {
          id: mockEdge.id,
          points: [
            { x: 50, y: 50 },
            { x: 200, y: 200 },
          ],
          sourcePosition: { x: 50, y: 50 },
          targetPosition: { x: 200, y: 200 },
          labels: undefined,
        },
      ],
    });
  });

  it('should preserve manual points when routingMode is manual', () => {
    const manualPoints = [
      { x: 100, y: 100 },
      { x: 150, y: 100 },
      { x: 150, y: 200 },
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
          routingMode: 'manual',
          points: manualPoints,
        },
      ],
      metadata: { ...initialState.metadata },
    };

    context = {
      ...context,
      state: newState,
      modelActionType: 'init',
      nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
    } as unknown as MiddlewareContext<
      [],
      Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
      EdgesRoutingMiddlewareMetadata
    >;

    edgesRoutingMiddleware.execute(context, nextMock, () => null);

    // Check that next was called
    expect(nextMock).toHaveBeenCalled();
    const callArgs = nextMock.mock.calls[0][0];

    // In manual mode, points should not be updated
    if (callArgs?.edgesToUpdate) {
      const edgeUpdate = callArgs.edgesToUpdate.find((e: Edge) => e.id === 'manual-edge');
      // Points should not be in the update for manual mode
      expect(edgeUpdate?.points).toBeUndefined();
      // But source and target positions should still be set
      expect(edgeUpdate?.sourcePosition).toBeDefined();
      expect(edgeUpdate?.targetPosition).toBeDefined();
    }
  });

  it('should compute points automatically when routingMode is auto', () => {
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
          sourcePort: 'port-1',
          targetPort: 'port-2',
          routingMode: 'auto',
          routing: 'orthogonal',
          points: [], // Empty points should be computed
        },
      ],
      metadata: { ...initialState.metadata },
    };

    context = {
      ...context,
      state: newState,
      modelActionType: 'init',
      nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
    } as unknown as MiddlewareContext<
      [],
      Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
      EdgesRoutingMiddlewareMetadata
    >;

    edgesRoutingMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledWith({
      edgesToUpdate: [
        {
          id: 'auto-edge',
          points: [
            { x: 50, y: 50 },
            { x: 200, y: 200 },
          ],
          sourcePosition: { x: 50, y: 50 },
          targetPosition: { x: 200, y: 200 },
          labels: undefined,
        },
      ],
    });
  });

  it('should default to auto mode when routingMode is not specified', () => {
    const newState = {
      nodes: [
        { ...mockNode, id: 'node-1', position: { x: 50, y: 50 } },
        { ...mockNode, id: 'node-2', position: { x: 200, y: 200 } },
      ],
      edges: [
        {
          ...mockEdge,
          id: 'default-edge',
          source: 'node-1',
          target: 'node-2',
          sourcePort: 'port-1',
          targetPort: 'port-2',
          routing: 'bezier',
          // routingMode not specified, should default to 'auto'
          points: [],
        },
      ],
      metadata: { ...initialState.metadata },
    };

    context = {
      ...context,
      state: newState,
      modelActionType: 'init',
      nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
    } as unknown as MiddlewareContext<
      [],
      Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
      EdgesRoutingMiddlewareMetadata
    >;

    edgesRoutingMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledWith({
      edgesToUpdate: [
        {
          id: 'default-edge',
          points: [
            { x: 50, y: 50 },
            { x: 200, y: 200 },
          ],
          sourcePosition: { x: 50, y: 50 },
          targetPosition: { x: 200, y: 200 },
          labels: undefined,
        },
      ],
    });
  });

  it('should update labels position in manual mode without changing points', () => {
    const manualPoints = [
      { x: 100, y: 100 },
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
          id: 'manual-edge-with-labels',
          source: 'node-1',
          target: 'node-2',
          routingMode: 'manual',
          routing: 'polyline',
          points: manualPoints,
          labels: [
            {
              id: 'label-1',
              positionOnEdge: 0.5,
            },
          ],
        },
      ],
      metadata: { ...initialState.metadata },
    };

    context = {
      ...context,
      state: newState,
      modelActionType: 'init',
      nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
    } as unknown as MiddlewareContext<
      [],
      Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
      EdgesRoutingMiddlewareMetadata
    >;

    checkIfEdgeChangedMock.mockReturnValue(true);

    edgesRoutingMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalled();
    const callArgs = nextMock.mock.calls[0][0];

    if (callArgs?.edgesToUpdate) {
      const edgeUpdate = callArgs.edgesToUpdate.find((e: Edge) => e.id === 'manual-edge-with-labels');
      // Points should not be updated in manual mode
      expect(edgeUpdate?.points).toBeUndefined();
      // But labels should be updated
      expect(edgeUpdate?.labels).toBeDefined();
      expect(edgeUpdate?.labels?.[0]?.position).toEqual({ x: 50, y: 50 });
    }
  });
});
