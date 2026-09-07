import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockEnvironment } from '../../../test-utils';
import type { Edge, MiddlewareContext, Node } from '../../../types';
import { internalIdMiddleware } from './internal-id-assignment';

describe('InternalIdMiddleware', () => {
  let context: MiddlewareContext;
  let nextMock: ReturnType<typeof vi.fn>;

  const setAdded = (nodes: Partial<Node>[] = [], edges: Partial<Edge>[] = []) => {
    context.helpers.anyNodesAdded = vi.fn().mockReturnValue(nodes.length > 0);
    context.helpers.anyEdgesAdded = vi.fn().mockReturnValue(edges.length > 0);
    context.helpers.getAddedNodes = vi.fn().mockReturnValue(nodes);
    context.helpers.getAddedEdges = vi.fn().mockReturnValue(edges);
  };

  beforeEach(() => {
    nextMock = vi.fn();

    context = {
      modelActionType: 'addNodes',
      modelActionTypes: ['addNodes'],
      initialState: {
        nodes: [],
        edges: [],
        metadata: { viewport: { x: 0, y: 0, scale: 1 } },
      },
      state: {
        nodes: [],
        edges: [],
        metadata: { viewport: { x: 0, y: 0, scale: 1 } },
      },
      nodesMap: new Map(),
      edgesMap: new Map(),
      initialNodesMap: new Map(),
      initialEdgesMap: new Map(),
      initialUpdate: {},
      history: [],
      helpers: {
        anyNodesAdded: vi.fn().mockReturnValue(false),
        anyEdgesAdded: vi.fn().mockReturnValue(false),
        getAddedNodes: vi.fn().mockReturnValue([]),
        getAddedEdges: vi.fn().mockReturnValue([]),
        checkIfAnyNodePropsChanged: vi.fn().mockReturnValue(false),
        checkIfAnyEdgePropsChanged: vi.fn().mockReturnValue(false),
        getAffectedNodeIds: vi.fn().mockReturnValue([]),
        getAffectedEdgeIds: vi.fn().mockReturnValue([]),
      },
      environment: {
        ...mockEnvironment,
        generateId: vi.fn().mockReturnValue('550e8400-e29b-41d4-a716-446655440000'),
      },
    } as unknown as MiddlewareContext;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not modify state when no nodes or edges are added', async () => {
    setAdded([], []);

    await internalIdMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledWith();
    expect(nextMock).toHaveBeenCalledTimes(1);
  });

  it('should emit _internalId PATCHES for added nodes, never re-emitting the whole objects', async () => {
    setAdded([
      { id: 'node1', position: { x: 0, y: 0 }, data: {} },
      { id: 'node2', position: { x: 10, y: 10 }, data: {} },
    ]);

    await internalIdMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledTimes(1);
    const stateUpdate = nextMock.mock.calls[0][0];

    // Patches carry ONLY id + _internalId. Re-emitting full objects would
    // revert properties other middlewares stamped on added elements earlier
    // in the pass (e.g. computedHidden).
    expect(stateUpdate.nodesToAdd).toBeUndefined();
    expect(stateUpdate.nodesToUpdate).toHaveLength(2);
    expect(Object.keys(stateUpdate.nodesToUpdate![0]).sort()).toEqual(['_internalId', 'id']);
    expect(stateUpdate.nodesToUpdate![0].id).toBe('node1');
    expect(stateUpdate.nodesToUpdate![0]._internalId).toMatch(
      /^node1-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(stateUpdate.nodesToUpdate![1]._internalId).toMatch(
      /^node2-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it('should always generate a new _internalId even if the added node carries one', async () => {
    setAdded([{ id: 'node1', position: { x: 0, y: 0 }, data: {}, _internalId: 'existing-internal-id' } as Node]);

    await internalIdMiddleware.execute(context, nextMock, () => null);

    const stateUpdate = nextMock.mock.calls[0][0];

    // A copied copy must not keep the original's key — trackBy would dedupe.
    expect(stateUpdate.nodesToUpdate![0]._internalId).not.toBe('existing-internal-id');
    expect(stateUpdate.nodesToUpdate![0]._internalId).toMatch(
      /^node1-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it('should generate unique _internalIds across added nodes', async () => {
    setAdded([
      { id: 'node1', position: { x: 0, y: 0 }, data: {} },
      { id: 'node2', position: { x: 10, y: 10 }, data: {} },
    ]);
    const generateIdMock = vi
      .spyOn(context.environment, 'generateId')
      .mockReturnValueOnce('550e8400-e29b-41d4-a716-446655440000')
      .mockReturnValueOnce('6ba7b810-9dad-11d1-80b4-00c04fd430c8');

    await internalIdMiddleware.execute(context, nextMock, () => null);

    const stateUpdate = nextMock.mock.calls[0][0];
    expect(stateUpdate.nodesToUpdate![0]._internalId).not.toBe(stateUpdate.nodesToUpdate![1]._internalId);

    generateIdMock.mockRestore();
  });

  it('should emit _internalId patches for added edges', async () => {
    setAdded(
      [],
      [
        { id: 'edge1', source: 'node1', target: 'node2', data: {} },
        { id: 'edge2', source: 'node2', target: 'node3', data: {} },
      ]
    );

    await internalIdMiddleware.execute(context, nextMock, () => null);

    const stateUpdate = nextMock.mock.calls[0][0];

    expect(stateUpdate.edgesToAdd).toBeUndefined();
    expect(stateUpdate.nodesToUpdate).toBeUndefined();
    expect(stateUpdate.edgesToUpdate).toHaveLength(2);
    expect(Object.keys(stateUpdate.edgesToUpdate![0]).sort()).toEqual(['_internalId', 'id']);
    expect(stateUpdate.edgesToUpdate![0]._internalId).toMatch(
      /^edge1-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(stateUpdate.edgesToUpdate![1]._internalId).toMatch(
      /^edge2-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it('should always generate a new _internalId for edges even if already present', async () => {
    setAdded([], [{ id: 'edge1', source: 'node1', target: 'node2', data: {}, _internalId: 'existing' } as Edge]);

    await internalIdMiddleware.execute(context, nextMock, () => null);

    const stateUpdate = nextMock.mock.calls[0][0];
    expect(stateUpdate.edgesToUpdate![0]._internalId).not.toBe('existing');
  });

  it('should patch nodes and edges added in the same pass', async () => {
    setAdded(
      [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      [{ id: 'edge1', source: 'node1', target: 'node2', data: {} }]
    );

    await internalIdMiddleware.execute(context, nextMock, () => null);

    const stateUpdate = nextMock.mock.calls[0][0];
    expect(stateUpdate.nodesToUpdate).toHaveLength(1);
    expect(stateUpdate.edgesToUpdate).toHaveLength(1);
  });

  it('should emit an empty update when the added helpers report nothing despite the flags', async () => {
    context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
    context.helpers.getAddedNodes = vi.fn().mockReturnValue([]);

    await internalIdMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(nextMock.mock.calls[0][0]).toEqual({});
  });
});
