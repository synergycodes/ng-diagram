import { beforeEach, describe, expect, it } from 'vitest';
import { mockEdge, mockMetadata, mockNode } from '../../../test-utils';
import type { FlowState } from '../../../types';
import { edgesStraightRoutingMiddleware } from '../edges-straight-routing';

describe('Edges Straight Routing Middleware', () => {
  let initialState: FlowState;

  beforeEach(() => {
    initialState = {
      nodes: [mockNode],
      edges: [mockEdge],
      metadata: mockMetadata,
    };
  });

  it('should return the initial state if model action is not relevant', () => {
    const state = edgesStraightRoutingMiddleware.execute(initialState, {
      modelActionType: 'moveViewport',
      initialState,
      historyUpdates: [],
    });
    expect(state).toEqual(initialState);
  });

  it('should return the initial state if there are no edges', () => {
    initialState.edges = [];
    const state = edgesStraightRoutingMiddleware.execute(initialState, {
      modelActionType: 'addNodes',
      initialState,
      historyUpdates: [],
    });
    expect(state).toEqual(initialState);
  });

  it('should return the initial state if there are no edges to route', () => {
    initialState.edges[0].routing = 'custom-routing';
    const state = edgesStraightRoutingMiddleware.execute(initialState, {
      modelActionType: 'addNodes',
      initialState,
      historyUpdates: [],
    });
    expect(state).toEqual(initialState);
  });

  it('should route only edges with routing set to straight or undefined and leave other edges unchanged', () => {
    initialState.nodes = [
      { ...mockNode, id: 'node-1', position: { x: 100, y: 100 } },
      { ...mockNode, id: 'node-2', position: { x: 200, y: 200 } },
      { ...mockNode, id: 'node-3', position: { x: 300, y: 300 } },
    ];
    initialState.edges = [
      { ...mockEdge, points: [], id: 'edge-1', source: 'node-1', target: 'node-2', routing: 'custom-routing' },
      { ...mockEdge, points: [], id: 'edge-2', source: 'node-2', target: 'node-3', routing: 'straight' },
      { ...mockEdge, points: [], id: 'edge-3', source: 'node-3', target: 'node-1', routing: undefined },
    ];

    const state = edgesStraightRoutingMiddleware.execute(initialState, {
      modelActionType: 'addEdges',
      initialState,
      historyUpdates: [],
    });

    expect(state.edges[0]).toEqual(initialState.edges[0]);
    expect(state.edges[1]).toEqual({
      ...initialState.edges[1],
      points: [
        { x: 200, y: 200 },
        { x: 300, y: 300 },
      ],
      sourcePosition: { x: 200, y: 200 },
      targetPosition: { x: 300, y: 300 },
    });
    expect(state.edges[2]).toEqual({
      ...initialState.edges[2],
      points: [
        { x: 300, y: 300 },
        { x: 100, y: 100 },
      ],
      sourcePosition: { x: 300, y: 300 },
      targetPosition: { x: 100, y: 100 },
    });
  });

  it('should route temporary edge', () => {
    initialState.nodes = [{ ...mockNode, id: 'node-1', position: { x: 100, y: 100 } }];
    initialState.metadata.temporaryEdge = {
      ...mockEdge,
      points: [],
      source: 'node-1',
      target: 'node-2',
      targetPosition: { x: 200, y: 200 },
    };

    const state = edgesStraightRoutingMiddleware.execute(initialState, {
      modelActionType: 'moveTemporaryEdge',
      initialState,
      historyUpdates: [],
    });

    expect(state.metadata.temporaryEdge).toEqual({
      ...initialState.metadata.temporaryEdge,
      points: [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
      ],
      sourcePosition: { x: 100, y: 100 },
      targetPosition: { x: 200, y: 200 },
    });
  });
});
