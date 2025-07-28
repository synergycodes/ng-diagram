import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEdge, mockMetadata, mockNode } from '../../../test-utils';
import type {
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
  getPortFlowPositionSide: (node: Node) => node.position,
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
    flowCore = {} as unknown as FlowCore;
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
    context = {
      ...context,
      modelActionType: 'init',
      state: { ...initialState, edges: [{ ...mockEdge, routing: 'custom-routing' }] } as unknown as FlowState<
        Metadata<MiddlewaresConfigFromMiddlewares<[]>>
      >,
    };

    edgesRoutingMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledWith({});
  });

  it('should route only edges with routing set to straight or orthogonal or undefined. If an edge has a defined type, then sourcePosition, targetPosition, and labels should be set. All other edges should remain unchanged.', () => {
    const newState = {
      nodes: [
        { ...mockNode, id: 'node-1', position: { x: 100, y: 100 } },
        { ...mockNode, id: 'node-2', position: { x: 200, y: 200 } },
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
          routing: 'straight',
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
    context = {
      ...context,
      state: newState,
      modelActionType: 'init',
      nodesMap: new Map(newState.nodes.map((node) => [node.id, node])),
    };

    edgesRoutingMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledWith({
      edgesToUpdate: [
        {
          id: 'edge-1',
          sourcePosition: { x: 100, y: 100 },
          targetPosition: { x: 200, y: 200 },
          labels: undefined,
        },
        {
          id: 'edge-2',
          points: [{ x: 200, y: 200 }],
          sourcePosition: { x: 200, y: 200 },
          targetPosition: undefined,
          labels: undefined,
        },
        {
          id: 'edge-3',
          points: [{ x: 100, y: 100 }],
          sourcePosition: undefined,
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
});
