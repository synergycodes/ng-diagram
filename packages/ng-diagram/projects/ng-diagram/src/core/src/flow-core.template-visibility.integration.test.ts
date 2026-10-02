/**
 * Integration test for template-visibility registry writes through a REAL
 * FlowCore: real registry callbacks, real coalesced flush, real middleware
 * chain and a real model commit. The FlowCore unit tests count the flush
 * against a mocked `applyUpdate`, and the middleware chain tests drive the
 * chain without a FlowCore — this file is the one place that verifies the
 * whole loop: many registry writes in one tick cost exactly one
 * `templateVisibilityChange` pass, and that single pass lands `computedHidden`
 * for every written element (and its dependent edges) in the committed model.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowCore } from './flow-core';
import { createInMemoryModelAdapter, createTestFlowCore, flushMicrotasks } from './test-utils';
import type { Edge, Middleware, ModelAdapter, Node } from './types';

const node = (id: string): Node => ({ id, position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, data: {} });
const edge = (id: string, source: string, target: string): Edge => ({ id, source, target, data: {} });

describe('template visibility writes through a real FlowCore', () => {
  let model: ModelAdapter;
  let flowCore: FlowCore;
  let visibilityPasses: number;

  /** Counts the middleware passes that carry the template-visibility action. */
  const passCounter: Middleware<'pass-counter'> = {
    name: 'pass-counter',
    execute: (context, next) => {
      if (context.modelActionTypes.includes('templateVisibilityChange')) {
        visibilityPasses++;
      }
      next();
    },
  };

  beforeEach(() => {
    // Timers frozen: initialization stays pending (its stability and safety
    // timers never fire), so the only pass that can run is the flushed one.
    // The flush itself is a microtask and the pipeline is promise-driven, so
    // neither needs the clock.
    vi.useFakeTimers();
    visibilityPasses = 0;

    model = createInMemoryModelAdapter();
    model.updateNodes([node('a'), node('b'), node('c'), node('d')]);
    model.updateEdges([
      // Hidden through its own registry entry — both endpoints stay visible.
      edge('own-hidden', 'c', 'd'),
      // Hidden through its source endpoint.
      edge('via-endpoint', 'a', 'c'),
      // Stays visible.
      edge('visible', 'd', 'c'),
    ]);

    flowCore = createTestFlowCore(model, [passCounter]);
  });

  afterEach(() => {
    flowCore.destroy();
    vi.useRealTimers();
  });

  it('should stamp every element written in one tick through exactly one middleware pass', async () => {
    const applyUpdateSpy = vi.spyOn(flowCore, 'applyUpdate');
    const refreshSpy = vi.spyOn(flowCore.initUpdater, 'refreshHiddenEntities');

    flowCore.templateVisibilityRegistry.setNodeHidden('a', true);
    flowCore.templateVisibilityRegistry.setNodeHidden('b', true);
    flowCore.templateVisibilityRegistry.setEdgeHidden('own-hidden', true);

    // Nothing is committed synchronously — the writers may sit inside an
    // Angular reactive context, where a synchronous signal write throws.
    expect(applyUpdateSpy).not.toHaveBeenCalled();
    expect(refreshSpy).not.toHaveBeenCalled();
    expect(model.getNodes().find((n) => n.id === 'a')?.computedHidden).toBeUndefined();

    // Drain the flush microtask, then wait for the pass it started to commit.
    await flushMicrotasks();
    await Promise.all(applyUpdateSpy.mock.results.map((result) => result.value));
    await flushMicrotasks();

    expect(applyUpdateSpy).toHaveBeenCalledTimes(1);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(applyUpdateSpy).toHaveBeenCalledWith({}, 'templateVisibilityChange');
    expect(visibilityPasses).toBe(1);

    const nodesById = new Map(model.getNodes().map((n) => [n.id, n]));
    expect(nodesById.get('a')?.computedHidden).toBe(true);
    expect(nodesById.get('b')?.computedHidden).toBe(true);
    expect(nodesById.get('c')?.computedHidden).toBeFalsy();
    expect(nodesById.get('d')?.computedHidden).toBeFalsy();

    const edgesById = new Map(model.getEdges().map((e) => [e.id, e]));
    expect(edgesById.get('own-hidden')?.computedHidden).toBe(true);
    expect(edgesById.get('via-endpoint')?.computedHidden).toBe(true);
    expect(edgesById.get('visible')?.computedHidden).toBeFalsy();

    // One pass, one effective-visibility change — consumers keyed on the
    // generation (the virtualized render cache) invalidate exactly once.
    expect(flowCore.visibilityGeneration.version).toBe(1);
  });

  it('should unhide through the same single-pass path and leave the model consistent', async () => {
    flowCore.templateVisibilityRegistry.setNodeHidden('a', true);
    await flushMicrotasks();
    await flushMicrotasks();
    expect(model.getEdges().find((e) => e.id === 'via-endpoint')?.computedHidden).toBe(true);

    const applyUpdateSpy = vi.spyOn(flowCore, 'applyUpdate');
    const refreshSpy = vi.spyOn(flowCore.initUpdater, 'refreshHiddenEntities');
    flowCore.templateVisibilityRegistry.setNodeHidden('a', false);

    await flushMicrotasks();
    await Promise.all(applyUpdateSpy.mock.results.map((result) => result.value));
    await flushMicrotasks();

    expect(applyUpdateSpy).toHaveBeenCalledTimes(1);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(model.getNodes().find((n) => n.id === 'a')?.computedHidden).toBe(false);
    // The edge hidden only through its endpoint follows the endpoint back.
    expect(model.getEdges().find((e) => e.id === 'via-endpoint')?.computedHidden).toBe(false);
    expect(visibilityPasses).toBe(2);
  });
});
