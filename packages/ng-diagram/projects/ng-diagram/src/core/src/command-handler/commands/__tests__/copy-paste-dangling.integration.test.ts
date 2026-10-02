/**
 * Pasting an edge whose endpoint nodes were not copied must not attach the
 * copy to the original nodes. The unit tests check the update the paste
 * command builds; this file runs it through a real FlowCore so the pasted
 * free ends go through routing: the committed edge keeps its free ends at
 * the shifted positions and its path is recomputed from them. The routing
 * middleware is registered explicitly: the Angular layer composes the default
 * chain, a bare core FlowCore has none.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { FlowCore } from '../../../flow-core';
import { edgesRoutingMiddleware } from '../../../middleware-manager/middlewares/edges-routing';
import { createInMemoryModelAdapter, createTestFlowCore, mockEnvironment } from '../../../test-utils';
import type { Edge, ModelAdapter, Point } from '../../../types';

const PASTE_OFFSET = 20;

// Pasted elements get their ids from the environment; the shared mock returns undefined.
let generated = 0;
const environment = { ...mockEnvironment, generateId: () => `pasted-${++generated}` };

const shifted = (point: Point): Point => ({ x: point.x + PASTE_OFFSET, y: point.y + PASTE_OFFSET });

describe('paste with free edge ends (integration)', () => {
  let model: ModelAdapter;
  let flowCore: FlowCore;

  afterEach(() => {
    flowCore.destroy();
  });

  const edgeById = (id: string): Edge => {
    const edge = model.getEdges().find((candidate) => candidate.id === id);
    if (!edge) {
      throw new Error(`edge ${id} not in model`);
    }
    return edge;
  };

  const pastedEdge = (): Edge => {
    const pasted = model.getEdges().filter((edge) => edge.id !== 'a-to-b');
    expect(pasted).toHaveLength(1);
    expect(pasted[0].id).toMatch(/^pasted-/);
    return pasted[0];
  };

  // Two sized nodes and one routed edge between them; `selectA` puts the
  // source node into the copied set as well.
  const setup = async (selectA: boolean) => {
    model = createInMemoryModelAdapter();
    flowCore = createTestFlowCore(model, [edgesRoutingMiddleware], environment);

    await flowCore.commandHandler.emit('addNodes', {
      nodes: [
        { id: 'a', position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, selected: selectA, data: {} },
        { id: 'b', position: { x: 300, y: 0 }, size: { width: 100, height: 50 }, selected: false, data: {} },
      ],
    });
    await flowCore.commandHandler.emit('addEdges', {
      edges: [{ id: 'a-to-b', source: 'a', target: 'b', selected: true, data: {} }],
    });

    // Routing has stamped the attachment points the paste will free.
    const original = edgeById('a-to-b');
    expect(original.sourcePosition).toBeDefined();
    expect(original.targetPosition).toBeDefined();
    expect(original.points?.length).toBeGreaterThan(1);
    return original;
  };

  it('should paste a lone edge with both ends free and routed from the shifted positions', async () => {
    const original = await setup(false);

    await flowCore.commandHandler.emit('copy');
    await flowCore.commandHandler.emit('paste', {});

    expect(model.getNodes()).toHaveLength(2);
    const pasted = pastedEdge();
    expect(pasted.source).toBe('');
    expect(pasted.target).toBe('');
    expect(pasted.sourcePort).toBeUndefined();
    expect(pasted.targetPort).toBeUndefined();
    expect(pasted.sourcePosition).toEqual(shifted(original.sourcePosition!));
    expect(pasted.targetPosition).toEqual(shifted(original.targetPosition!));
    // The path was recomputed between the free ends, not copied from the original.
    expect(pasted.points?.at(0)).toEqual(pasted.sourcePosition);
    expect(pasted.points?.at(-1)).toEqual(pasted.targetPosition);
    expect(pasted.points).not.toEqual(original.points);

    // The original connection exists exactly once.
    const between = model.getEdges().filter((edge) => edge.source === 'a' && edge.target === 'b');
    expect(between).toHaveLength(1);
  });

  it('should remap the copied end and free the other one when one endpoint node was copied', async () => {
    const original = await setup(true);

    await flowCore.commandHandler.emit('copy');
    await flowCore.commandHandler.emit('paste', {});

    const pastedNodes = model.getNodes().filter((node) => node.id !== 'a' && node.id !== 'b');
    expect(pastedNodes).toHaveLength(1);
    expect(pastedNodes[0].id).toMatch(/^pasted-/);
    const pasted = pastedEdge();
    expect(pasted.source).toBe(pastedNodes[0].id);
    expect(pasted.target).toBe('');
    expect(pasted.targetPort).toBeUndefined();
    expect(pasted.targetPosition).toEqual(shifted(original.targetPosition!));
    // Routed from the pasted node to the free end.
    expect(pasted.points?.at(0)).toEqual(pasted.sourcePosition);
    expect(pasted.points?.at(-1)).toEqual(pasted.targetPosition);
    expect(pasted.sourcePosition).not.toEqual(original.sourcePosition);

    const between = model.getEdges().filter((edge) => edge.source === 'a' && edge.target === 'b');
    expect(between).toHaveLength(1);
  });
});
