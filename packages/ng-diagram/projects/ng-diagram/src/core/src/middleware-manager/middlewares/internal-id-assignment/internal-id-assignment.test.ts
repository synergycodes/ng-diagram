import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockEnvironment } from '../../../test-utils';
import type { MiddlewareContext } from '../../../types';
import { internalIdMiddleware } from './internal-id-assignment';

describe('InternalIdMiddleware', () => {
  let context: MiddlewareContext;
  let nextMock: ReturnType<typeof vi.fn>;

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

  it('should not modify state when no nodes are added', async () => {
    context.helpers.anyNodesAdded = vi.fn().mockReturnValue(false);

    await internalIdMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledWith();
    expect(nextMock).toHaveBeenCalledTimes(1);
  });

  it('should generate _internalId for nodes without existing _internalId', async () => {
    const mockNodes = [
      { id: 'node1', position: { x: 0, y: 0 }, data: {} },
      { id: 'node2', position: { x: 10, y: 10 }, data: {} },
    ];

    context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
    context.initialUpdate = { nodesToAdd: mockNodes };

    await internalIdMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledTimes(1);
    const stateUpdate = nextMock.mock.calls[0][0];

    expect(stateUpdate).toBeDefined();
    expect(stateUpdate.nodesToAdd).toHaveLength(2);

    // Check that _internalId was generated with correct format
    expect(stateUpdate.nodesToAdd![0]._internalId).toMatch(
      /^node1-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(stateUpdate.nodesToAdd![1]._internalId).toMatch(
      /^node2-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );

    // Check that other properties are preserved
    expect(stateUpdate.nodesToAdd![0].id).toBe('node1');
    expect(stateUpdate.nodesToAdd![0].position).toEqual({ x: 0, y: 0 });
    expect(stateUpdate.nodesToAdd![1].id).toBe('node2');
    expect(stateUpdate.nodesToAdd![1].position).toEqual({ x: 10, y: 10 });
  });

  it('should always generate new _internalId even if already present', async () => {
    const mockNodes = [
      {
        id: 'node1',
        position: { x: 0, y: 0 },
        data: {},
        _internalId: 'existing-internal-id',
      },
    ];

    context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
    context.initialUpdate = { nodesToAdd: mockNodes };

    await internalIdMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledTimes(1);
    const stateUpdate = nextMock.mock.calls[0][0];

    // Should generate a new _internalId, not preserve the existing one
    // This prevents duplicated keys when copying a copy
    expect(stateUpdate.nodesToAdd![0]._internalId).not.toBe('existing-internal-id');
    expect(stateUpdate.nodesToAdd![0]._internalId).toMatch(
      /^node1-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it('should generate unique _internalIds for multiple nodes', async () => {
    const mockNodes = [
      { id: 'node1', position: { x: 0, y: 0 }, data: {} },
      { id: 'node1', position: { x: 10, y: 10 }, data: {} }, // Same id, different position
    ];

    context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
    context.initialUpdate = { nodesToAdd: mockNodes };

    // Mock different UUIDs for sequential calls
    const randomUUIDMock = vi
      .spyOn(context.environment, 'generateId')
      .mockReturnValueOnce('550e8400-e29b-41d4-a716-446655440000')
      .mockReturnValueOnce('6ba7b810-9dad-11d1-80b4-00c04fd430c8');

    await internalIdMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledTimes(1);
    const stateUpdate = nextMock.mock.calls[0][0];

    expect(stateUpdate.nodesToAdd![0]._internalId).toBeDefined();
    expect(stateUpdate.nodesToAdd![1]._internalId).toBeDefined();
    expect(stateUpdate.nodesToAdd![0]._internalId).not.toBe(stateUpdate.nodesToAdd![1]._internalId);

    randomUUIDMock.mockRestore();
  });

  it('should preserve other initialUpdate properties', async () => {
    const mockNodes = [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }];

    context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
    context.initialUpdate = {
      nodesToAdd: mockNodes,
      edgesToAdd: [{ id: 'edge1', source: 'node1', target: 'node2', data: {} }],
      metadataUpdate: { viewport: { x: 100, y: 100, scale: 1.5 } },
    };

    await internalIdMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledTimes(1);
    const stateUpdate = nextMock.mock.calls[0][0];

    expect(stateUpdate.nodesToAdd).toBeDefined();
    expect(stateUpdate.edgesToAdd).toEqual(context.initialUpdate.edgesToAdd);
    expect(stateUpdate.metadataUpdate).toEqual(context.initialUpdate.metadataUpdate);
  });

  it('should handle empty nodesToAdd array', async () => {
    context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
    context.initialUpdate = { nodesToAdd: [] };

    await internalIdMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledTimes(1);
    const stateUpdate = nextMock.mock.calls[0][0];

    expect(stateUpdate.nodesToAdd).toEqual([]);
  });

  it('should handle undefined nodesToAdd', async () => {
    context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
    context.initialUpdate = {};

    await internalIdMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledTimes(1);
    const stateUpdate = nextMock.mock.calls[0][0];

    expect(stateUpdate.nodesToAdd).toBeUndefined();
  });

  it('should generate _internalId with correct UUID format', async () => {
    const mockNodes = [{ id: 'test-node', position: { x: 0, y: 0 }, data: {} }];

    context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
    context.initialUpdate = { nodesToAdd: mockNodes };

    // Use a predictable UUID so the regex is deterministic
    const randomUUIDMock = vi
      .spyOn(context.environment, 'generateId')
      .mockReturnValue('550e8400-e29b-41d4-a716-446655440000');

    await internalIdMiddleware.execute(context, nextMock, () => null);

    const stateUpdate = nextMock.mock.calls[0][0];
    const internalId = stateUpdate.nodesToAdd![0]._internalId as string;

    // Should match pattern: nodeId-uuid
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    const fullPattern = /^test-node-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

    expect(internalId).toMatch(fullPattern);

    // Extract UUID part and verify it's a valid UUID
    const uuidPart = internalId.replace('test-node-', '');
    expect(uuidPart).toMatch(uuidPattern);

    randomUUIDMock.mockRestore();
  });

  it('should handle nodes with complex data structures', async () => {
    const mockNodes = [
      {
        id: 'complex-node',
        position: { x: 100, y: 200 },
        data: {
          label: 'Test Node',
          metadata: { type: 'custom', version: 1 },
          nested: { deep: { value: 'test' } },
        },
        type: 'custom',
        selected: true,
        size: { width: 100, height: 50 },
      },
    ];

    context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
    context.initialUpdate = { nodesToAdd: mockNodes };

    await internalIdMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledTimes(1);
    const stateUpdate = nextMock.mock.calls[0][0];

    expect(stateUpdate.nodesToAdd![0]._internalId).toBeDefined();
    expect(stateUpdate.nodesToAdd![0]._internalId).toMatch(
      /^complex-node-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );

    // Verify all other properties are preserved
    expect(stateUpdate.nodesToAdd![0].id).toBe('complex-node');
    expect(stateUpdate.nodesToAdd![0].position).toEqual({ x: 100, y: 200 });
    expect(stateUpdate.nodesToAdd![0].data).toEqual(mockNodes[0].data);
    expect(stateUpdate.nodesToAdd![0].type).toBe('custom');
    expect(stateUpdate.nodesToAdd![0].selected).toBe(true);
    expect(stateUpdate.nodesToAdd![0].size).toEqual({ width: 100, height: 50 });
  });

  it('should always generate new _internalId for all nodes', async () => {
    const mockNodes = [
      { id: 'node1', position: { x: 0, y: 0 }, data: {} },
      {
        id: 'node2',
        position: { x: 10, y: 10 },
        data: {},
        _internalId: 'old-id-that-should-be-replaced',
      },
      { id: 'node3', position: { x: 20, y: 20 }, data: {} },
    ];

    context.helpers.anyNodesAdded = vi.fn().mockReturnValue(true);
    context.initialUpdate = { nodesToAdd: mockNodes };

    // Mock different UUIDs for each node
    const randomUUIDMock = vi
      .spyOn(context.environment, 'generateId')
      .mockReturnValueOnce('550e8400-e29b-41d4-a716-446655440000')
      .mockReturnValueOnce('6ba7b810-9dad-11d1-80b4-00c04fd430c8')
      .mockReturnValueOnce('7c9e6679-7425-40de-944b-e07fc1f90ae7');

    await internalIdMiddleware.execute(context, nextMock, () => null);

    expect(nextMock).toHaveBeenCalledTimes(1);
    const stateUpdate = nextMock.mock.calls[0][0];

    // All nodes should get new _internalId values
    expect(stateUpdate.nodesToAdd![0]._internalId).toMatch(
      /^node1-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(stateUpdate.nodesToAdd![1]._internalId).not.toBe('old-id-that-should-be-replaced');
    expect(stateUpdate.nodesToAdd![1]._internalId).toMatch(
      /^node2-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(stateUpdate.nodesToAdd![2]._internalId).toMatch(
      /^node3-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );

    randomUUIDMock.mockRestore();
  });
});
