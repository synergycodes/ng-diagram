import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Edge, FlowStateUpdate, MiddlewareContext, Node } from '../../../types';
import { ChangeGeneration } from '../../../utils';
import { TemplateVisibilityRegistry } from '../../../visibility/template-visibility-registry';
import { createHiddenComputationMiddleware, HiddenComputationOptions } from './hidden-computation';

describe('hiddenComputationMiddleware', () => {
  let registry: TemplateVisibilityRegistry;
  let nextMock: ReturnType<typeof vi.fn>;

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

  const createContext = (
    nodes: Node[],
    edges: Edge[],
    {
      modelActionTypes = ['updateNodes'],
      changedNodeProps = [] as string[],
      changedEdgeProps = [] as string[],
      addedNodes = [] as Node[],
      addedEdges = [] as Edge[],
      nodesRemoved = false,
      removedNodes = [] as Node[],
      removedEdges = [] as Edge[],
    } = {}
  ): MiddlewareContext =>
    ({
      modelActionTypes,
      state: { nodes, edges, metadata: {} },
      helpers: {
        anyNodesAdded: vi.fn().mockReturnValue(addedNodes.length > 0),
        anyEdgesAdded: vi.fn().mockReturnValue(addedEdges.length > 0),
        anyNodesRemoved: vi.fn().mockReturnValue(nodesRemoved || removedNodes.length > 0),
        anyEdgesRemoved: vi.fn().mockReturnValue(removedEdges.length > 0),
        getRemovedNodes: vi.fn().mockReturnValue(removedNodes),
        getRemovedEdges: vi.fn().mockReturnValue(removedEdges),
        getAddedNodes: vi.fn().mockReturnValue(addedNodes),
        getAddedEdges: vi.fn().mockReturnValue(addedEdges),
        checkIfAnyNodePropsChanged: vi
          .fn()
          .mockImplementation((props: string[]) => props.some((prop) => changedNodeProps.includes(prop))),
        checkIfAnyEdgePropsChanged: vi
          .fn()
          .mockImplementation((props: string[]) => props.some((prop) => changedEdgeProps.includes(prop))),
      },
    }) as unknown as MiddlewareContext;

  const execute = (context: MiddlewareContext, options: Partial<HiddenComputationOptions> = {}) => {
    createHiddenComputationMiddleware(registry, { name: 'hidden-computation', ...options }).execute(
      context,
      nextMock,
      () => null
    );
    return nextMock.mock.calls[0]?.[0] as FlowStateUpdate | undefined;
  };

  beforeEach(() => {
    registry = new TemplateVisibilityRegistry();
    nextMock = vi.fn();
  });

  it('should pass through without recomputing when nothing visibility-relevant changed', () => {
    const context = createContext([createNode('a', { hidden: true })], []);

    const update = execute(context);

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(update).toBeUndefined();
  });

  it('should stamp computedHidden on init', () => {
    const nodes = [createNode('group', { hidden: true }), createNode('child', { groupId: 'group' }), createNode('c')];
    const edges = [createEdge('e1', 'child', 'c'), createEdge('e2', 'c', 'c2')];
    const context = createContext(nodes, edges, { modelActionTypes: ['init'] });

    const update = execute(context);

    expect(update?.nodesToUpdate).toEqual([
      { id: 'group', computedHidden: true },
      { id: 'child', computedHidden: true },
    ]);
    expect(update?.edgesToUpdate).toEqual([{ id: 'e1', computedHidden: true }]);
  });

  it('should recompute when the hidden prop changed', () => {
    const nodes = [createNode('a', { hidden: true })];
    const context = createContext(nodes, [], { changedNodeProps: ['hidden'] });

    const update = execute(context);

    expect(update?.nodesToUpdate).toEqual([{ id: 'a', computedHidden: true }]);
  });

  it('should clear computedHidden when an element becomes visible again', () => {
    const nodes = [createNode('a', { computedHidden: true })];
    const context = createContext(nodes, [], { changedNodeProps: ['hidden'] });

    const update = execute(context);

    expect(update?.nodesToUpdate).toEqual([{ id: 'a', computedHidden: false }]);
  });

  it('should not emit updates when effective visibility is unchanged', () => {
    const nodes = [createNode('a', { hidden: true, computedHidden: true }), createNode('b')];
    const context = createContext(nodes, [], { changedNodeProps: ['hidden'] });

    const update = execute(context);

    expect(update).toEqual({});
  });

  it('should recompute when groupId changed', () => {
    const nodes = [createNode('group', { hidden: true, computedHidden: true }), createNode('a', { groupId: 'group' })];
    const context = createContext(nodes, [], { changedNodeProps: ['groupId'] });

    const update = execute(context);

    expect(update?.nodesToUpdate).toEqual([{ id: 'a', computedHidden: true }]);
  });

  it('should recompute when nodes were removed (removing a group unhides descendants)', () => {
    // The group was removed from state; its former child still points at it.
    const nodes = [createNode('a', { groupId: 'gone', computedHidden: true })];
    const context = createContext(nodes, [], { nodesRemoved: true });

    const update = execute(context);

    expect(update?.nodesToUpdate).toEqual([{ id: 'a', computedHidden: false }]);
  });

  it('should stamp added nodes through nodesToAdd', () => {
    const added = createNode('new', { hidden: true });
    const context = createContext([added], [], { addedNodes: [added] });

    const update = execute(context);

    expect(update?.nodesToAdd).toEqual([{ ...added, computedHidden: true }]);
    expect(update?.nodesToUpdate).toBeUndefined();
  });

  it('should stamp added edges through edgesToAdd', () => {
    const added = createEdge('new', 'a', 'b', { hidden: true });
    const context = createContext([], [added], { addedEdges: [added] });

    const update = execute(context);

    expect(update?.edgesToAdd).toEqual([{ ...added, computedHidden: true }]);
  });

  it('should hide edges whose endpoint became hidden', () => {
    const nodes = [createNode('a', { hidden: true })];
    const edges = [createEdge('e', 'a', 'b')];
    const context = createContext(nodes, edges, { changedNodeProps: ['hidden'] });

    const update = execute(context);

    expect(update?.edgesToUpdate).toEqual([{ id: 'e', computedHidden: true }]);
  });

  it('should recompute when edge source/target changed', () => {
    const nodes = [createNode('a', { hidden: true, computedHidden: true }), createNode('b')];
    const edges = [createEdge('e', 'a', 'b')];
    const context = createContext(nodes, edges, { changedEdgeProps: ['source'] });

    const update = execute(context);

    expect(update?.edgesToUpdate).toEqual([{ id: 'e', computedHidden: true }]);
  });

  it('should recompute on templateVisibilityChange using registry state', () => {
    registry.setNodeHidden('a', true);
    const nodes = [createNode('a'), createNode('child', { groupId: 'a' })];
    const context = createContext(nodes, [], { modelActionTypes: ['templateVisibilityChange'] });

    const update = execute(context);

    expect(update?.nodesToUpdate).toEqual([
      { id: 'a', computedHidden: true },
      { id: 'child', computedHidden: true },
    ]);
  });

  it('should bump the visibility generation only when effective visibility actually changed', () => {
    const visibilityGeneration = new ChangeGeneration();
    const changed = createContext([createNode('a', { hidden: true })], [], { changedNodeProps: ['hidden'] });
    execute(changed, { visibilityGeneration });
    expect(visibilityGeneration.version).toBe(1);

    nextMock.mockClear();
    const unchanged = createContext([createNode('a', { hidden: true, computedHidden: true })], [], {
      changedNodeProps: ['hidden'],
    });
    execute(unchanged, { visibilityGeneration });
    expect(visibilityGeneration.version).toBe(1);
  });

  describe('registry cleanup for removed elements', () => {
    it('should drop registry entries of removed nodes and edges when cleanup is enabled', () => {
      registry.setNodeHidden('gone', true);
      registry.setPortHidden('gone', 'p', true);
      registry.setEdgeHidden('goneEdge', true);
      registry.setLabelHidden('goneEdge', 'l', true);

      const context = createContext([], [], {
        removedNodes: [createNode('gone')],
        removedEdges: [createEdge('goneEdge', 'a', 'b')],
      });
      execute(context, { cleanupRemovedEntries: true });

      expect(registry.isNodeHidden('gone')).toBe(false);
      expect(registry.isPortHidden('gone', 'p')).toBe(false);
      expect(registry.isEdgeHidden('goneEdge')).toBe(false);
      expect(registry.isLabelHidden('goneEdge', 'l')).toBe(false);
    });

    it('should not touch the registry when cleanup is disabled (finalize instance)', () => {
      registry.setNodeHidden('gone', true);

      const context = createContext([], [], { removedNodes: [createNode('gone')] });
      execute(context);

      expect(registry.isNodeHidden('gone')).toBe(true);
    });
  });
});
