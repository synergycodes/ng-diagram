/**
 * End-to-end middleware-chain tests for effective visibility.
 *
 * These run the REAL MiddlewareManager + MiddlewareExecutor with the real
 * internal-id-assignment middleware — the combination the unit tests (mocked
 * contexts) cannot reach. Regression net for the "computedHidden stamps on
 * added elements reverted by internal-id-assignment" bug: internalIdMiddleware
 * re-emits nodesToAdd/edgesToAdd from the pristine initial update, so a stamp
 * applied only BEFORE it never reaches the committed state — the finalize
 * instance at the tail must land it.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import type { Edge, FlowState, Middleware, Node } from '../../../types';
import { TemplateVisibilityRegistry } from '../../../visibility/template-visibility-registry';
import { MiddlewareManager } from '../../middleware-manager';
import { internalIdMiddleware } from '../internal-id-assignment/internal-id-assignment';

describe('hidden-computation through the real middleware chain', () => {
  let registry: TemplateVisibilityRegistry;
  let notifyVisibilityChanged: ReturnType<typeof vi.fn>;
  let nodesMap: Map<string, Node>;
  let edgesMap: Map<string, Edge>;
  let flowCore: FlowCore;

  const createNode = (id: string, overrides: Partial<Node> = {}): Node => ({
    id,
    position: { x: 0, y: 0 },
    data: {},
    ...overrides,
  });

  const createEdge = (id: string, source: string, target: string, overrides: Partial<Edge> = {}): Edge => ({
    id,
    source,
    target,
    data: {},
    ...overrides,
  });

  const stateOf = (nodes: Node[], edges: Edge[] = []): FlowState => ({
    nodes,
    edges,
    metadata: { viewport: { x: 0, y: 0, scale: 1 } } as FlowState['metadata'],
  });

  let idCounter = 0;

  const createManager = (extraMiddlewares: Middleware[] = []) => {
    registry = new TemplateVisibilityRegistry();
    notifyVisibilityChanged = vi.fn();
    nodesMap = new Map();
    edgesMap = new Map();
    idCounter = 0;

    flowCore = {
      modelLookup: {
        get nodesMap() {
          return nodesMap;
        },
        get edgesMap() {
          return edgesMap;
        },
        connectedEdgesMap: new Map(),
      },
      templateVisibilityRegistry: registry,
      notifyVisibilityChanged,
      config: { debugMode: false },
      environment: { generateId: () => `gen-${idCounter++}` },
      // eventManager / measurementTracker deliberately absent — the manager
      // skips their middlewares, keeping the chain to the visibility pair,
      // the provided middlewares and the built-in tail.
    } as unknown as FlowCore;

    return new MiddlewareManager(flowCore, [internalIdMiddleware, ...extraMiddlewares]);
  };

  const run = async (
    manager: MiddlewareManager,
    initial: FlowState,
    update: Parameters<MiddlewareManager['execute']>[1],
    actions: Parameters<MiddlewareManager['execute']>[2]
  ): Promise<FlowState> => {
    nodesMap = new Map(initial.nodes.map((node) => [node.id, node]));
    edgesMap = new Map(initial.edges.map((edge) => [edge.id, edge]));
    const result = await manager.execute(initial, update, actions);
    expect(result).toBeDefined();
    return result!;
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should commit computedHidden on an added node with hidden: true (survives internal-id re-emit)', async () => {
    const manager = createManager();

    const state = await run(manager, stateOf([]), { nodesToAdd: [createNode('a', { hidden: true })] }, ['addNodes']);

    const added = state.nodes.find((node) => node.id === 'a')!;
    expect(added.computedHidden).toBe(true);
    // internal-id-assignment ran too — both stamps must coexist.
    expect((added as Node & { _internalId?: string })._internalId).toBeDefined();
    expect(notifyVisibilityChanged).toHaveBeenCalled();
  });

  it('should commit computedHidden on a node added into a hidden group', async () => {
    const manager = createManager();
    const group = createNode('group', { hidden: true, computedHidden: true, isGroup: true } as Partial<Node>);

    const state = await run(manager, stateOf([group]), { nodesToAdd: [createNode('child', { groupId: 'group' })] }, [
      'addNodes',
    ]);

    expect(state.nodes.find((node) => node.id === 'child')!.computedHidden).toBe(true);
  });

  it('should commit computedHidden on an added edge whose endpoint is hidden', async () => {
    const manager = createManager();
    const hidden = createNode('h', { hidden: true, computedHidden: true });
    const visible = createNode('v');

    const state = await run(manager, stateOf([hidden, visible]), { edgesToAdd: [createEdge('e', 'v', 'h')] }, [
      'addEdges',
    ]);

    expect(state.edges.find((edge) => edge.id === 'e')!.computedHidden).toBe(true);
  });

  it('should correct a stale copied computedHidden on paste-like adds', async () => {
    const manager = createManager();
    // A pasted snapshot of a template-hidden original: visible by flag, stale stamp.
    const pasted = createNode('pasted', { computedHidden: true });

    const state = await run(manager, stateOf([]), { nodesToAdd: [pasted] }, ['paste']);

    expect(state.nodes.find((node) => node.id === 'pasted')!.computedHidden).toBe(false);
  });

  it('should stamp hidden written by a USER middleware within the same pass (finalize instance)', async () => {
    const hideByUserMiddleware: Middleware<'user-hider'> = {
      name: 'user-hider',
      execute: (context, next) => {
        // A user middleware reacting to the position change by hiding the node.
        if (context.helpers.checkIfAnyNodePropsChanged(['position'])) {
          next({ nodesToUpdate: [{ id: 'a', hidden: true }] });
          return;
        }
        next();
      },
    };
    const manager = createManager([hideByUserMiddleware]);
    const node = createNode('a');

    const state = await run(
      manager,
      stateOf([node, createNode('b')], [createEdge('e', 'a', 'b')]),
      { nodesToUpdate: [{ id: 'a', position: { x: 5, y: 5 } }] },
      ['updateNodes']
    );

    expect(state.nodes.find((n) => n.id === 'a')!.computedHidden).toBe(true);
    // The edge to the now-hidden node is stamped in the same pass too.
    expect(state.edges.find((e) => e.id === 'e')!.computedHidden).toBe(true);
  });

  it('should not notify visibility changes on passes that do not affect visibility', async () => {
    const manager = createManager();
    const node = createNode('a');

    await run(manager, stateOf([node]), { nodesToUpdate: [{ id: 'a', position: { x: 9, y: 9 } }] }, ['updateNodes']);

    expect(notifyVisibilityChanged).not.toHaveBeenCalled();
  });

  it('should drop registry entries of removed elements during the pass', async () => {
    const manager = createManager();
    registry.setNodeHidden('gone', true);
    registry.setPortHidden('gone', 'p', true);
    const node = createNode('gone', { computedHidden: true });

    await run(manager, stateOf([node]), { nodesToRemove: ['gone'] }, ['deleteNodes']);

    expect(registry.isNodeHidden('gone')).toBe(false);
    expect(registry.isPortHidden('gone', 'p')).toBe(false);
  });
});
