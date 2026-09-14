import type { Model } from 'ng-diagram';
import { expect, test, type Diagram } from './fixtures/diagram';
import { pair, trio } from './fixtures/models';

/**
 * Dangling edges (config `danglingEdges`) and edge relinking
 * (config `edgeRelinking`) — both opt-in, default off.
 */

/** Both free endpoints set — a dual dangling edge plus one anchored node. */
const danglingArena: Partial<Model> = {
  nodes: [{ id: 'node-a', position: { x: 80, y: 120 }, data: { label: 'A' } }],
  edges: [
    {
      id: 'dual',
      source: '',
      sourcePosition: { x: 400, y: 300 },
      target: '',
      targetPosition: { x: 550, y: 400 },
      data: {},
    },
  ],
};

/** Record every edgeRelinkEnded payload on the page for later assertions. */
async function recordRelinkEnded(diagram: Diagram): Promise<void> {
  await diagram.page.evaluate(() => {
    const events: unknown[] = [];
    (window as unknown as Record<string, unknown>).__relinkEnded = events;
    window.__diagram!.diagram.addEventListener('edgeRelinkEnded', (event) => {
      events.push({
        edge: event.edge.id,
        end: event.end,
        success: event.success,
        reason: event.reason ?? null,
        previousNode: event.previousNode?.id ?? null,
        target: event.target?.id ?? null,
        targetPort: event.targetPort ?? null,
      });
    });
  });
}

function relinkEnded(diagram: Diagram): Promise<unknown[]> {
  return diagram.page.evaluate(() => (window as unknown as Record<string, unknown>).__relinkEnded as unknown[]);
}

/** Drag from a port onto empty canvas and release. */
async function dragFromPortToCanvas(diagram: Diagram, node: string, port: string): Promise<{ x: number; y: number }> {
  const from = await diagram.centerOf(diagram.port(node, port), `port ${node}/${port}`);
  const to = { x: from.x + 200, y: from.y + 140 };
  await diagram.beginDrag(from, to);
  await diagram.page.mouse.up();
  return to;
}

test.describe('dangling edges', () => {
  test('link drop on empty canvas is discarded when the feature is off (default)', async ({ diagram }) => {
    await diagram.load({ model: pair });

    await dragFromPortToCanvas(diagram, 'node-a', 'port-right');

    await expect(diagram.allEdges).toHaveCount(0);
    expect(await diagram.model.edges()).toEqual([]);
  });

  test('link drop on empty canvas keeps a dangling edge when enabled', async ({ diagram }) => {
    await diagram.load({ model: pair, config: { danglingEdges: { enabled: true } } });

    const drop = await dragFromPortToCanvas(diagram, 'node-a', 'port-right');
    const dropFlow = await diagram.viewport.clientToFlowPosition(drop);

    await expect(diagram.allEdges).toHaveCount(1);
    await expect.poll(async () => (await diagram.model.edges()).length).toBe(1);

    const [edge] = await diagram.model.edges();
    expect(edge).toMatchObject({ source: 'node-a', target: '' });
    expect(edge.targetPosition).toEqual(dropFlow);
    // The free end routes toward the drop point.
    expect(edge.points!.at(-1)).toEqual(dropFlow);
    // Styling hook for dangling edges.
    await expect(diagram.edge(edge.id)).toHaveClass(/ng-diagram-edge--dangling/);
  });

  test('deleting a node deletes its edges by default', async ({ diagram }) => {
    await diagram.load({ model: trio });

    await diagram.selection.select(['node-b']);
    await diagram.selection.deleteSelection();

    await expect.poll(async () => (await diagram.model.edges()).length).toBe(0);
    expect(await diagram.model.getNodeById('node-b')).toBeNull();
  });

  test('deleting a node detaches its edges when detachOnNodeDelete is on', async ({ diagram }) => {
    await diagram.load({
      model: trio,
      config: { danglingEdges: { enabled: true, detachOnNodeDelete: true } },
    });

    await diagram.selection.select(['node-b']);
    await diagram.selection.deleteSelection();

    await expect.poll(async () => (await diagram.model.getNodeById('node-b')) === null).toBe(true);

    const edges = await diagram.model.edges();
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ id: 'edge-ab', source: 'node-a', target: '' });
    // Anchored where the deleted node was.
    expect(edges[0].targetPosition).toBeTruthy();
    await expect(diagram.edge('edge-ab')).toHaveClass(/ng-diagram-edge--dangling/);
  });

  test('an explicitly selected edge is deleted, not detached', async ({ diagram }) => {
    await diagram.load({
      model: trio,
      config: { danglingEdges: { enabled: true, detachOnNodeDelete: true } },
    });

    await diagram.selection.select(['node-b'], ['edge-ab']);
    await diagram.selection.deleteSelection();

    await expect.poll(async () => (await diagram.model.edges()).length).toBe(0);
  });

  test('a dual dangling edge renders and routes between its endpoints', async ({ diagram }) => {
    await diagram.load({ model: danglingArena });

    await expect(diagram.edge('dual')).toBeAttached();
    const edge = (await diagram.model.edges()).find((candidate) => candidate.id === 'dual')!;
    expect(edge.points![0]).toEqual({ x: 400, y: 300 });
    expect(edge.points!.at(-1)).toEqual({ x: 550, y: 400 });
  });

  test('copy/paste offsets the free endpoint of a dangling edge', async ({ diagram }) => {
    await diagram.load({ model: danglingArena });

    await diagram.selection.select([], ['dual']);
    await diagram.clipboard.copy();
    // The anchors' center is (475, 350); pasting at (675, 550) shifts everything by (200, 200).
    await diagram.clipboard.paste({ x: 675, y: 550 });

    await expect.poll(async () => (await diagram.model.edges()).length).toBe(2);
    const pasted = (await diagram.model.edges()).find((candidate) => candidate.id !== 'dual')!;
    expect(pasted.sourcePosition).toEqual({ x: 600, y: 500 });
    expect(pasted.targetPosition).toEqual({ x: 750, y: 600 });
  });
});

test.describe('edge relinking', () => {
  const relinkOn = { edgeRelinking: { enabled: true } };

  test('handles render only on selected edges and only when enabled', async ({ diagram }) => {
    await diagram.load({ model: trio });
    await diagram.selection.select([], ['edge-ab']);
    await expect(diagram.page.locator('[data-relink-handle]')).toHaveCount(0);

    await diagram.load({ model: trio, config: relinkOn });
    await expect(diagram.page.locator('[data-relink-handle]')).toHaveCount(0);
    await diagram.selection.select([], ['edge-ab']);
    await expect(diagram.page.locator('[data-relink-handle]')).toHaveCount(2);
  });

  test('dragging the target handle onto another port reconnects the edge', async ({ diagram }) => {
    await diagram.load({ model: trio, config: relinkOn });
    await recordRelinkEnded(diagram);
    await diagram.selection.select([], ['edge-ab']);

    const handle = await diagram.centerOf(
      diagram.edge('edge-ab').locator('[data-relink-handle="target"]'),
      'target handle of edge-ab'
    );
    const dst = await diagram.centerOf(diagram.port('node-c', 'port-left'), 'port node-c/port-left');
    await diagram.beginDrag(handle, dst);
    // The original edge is hidden during the drag and replaced by the preview.
    await expect(diagram.edge('TEMPORARY_EDGE')).toBeAttached();
    await expect(diagram.edge('edge-ab')).toHaveCount(0);
    await diagram.page.mouse.up();

    await expect.poll(async () => (await diagram.model.getEdgeById('edge-ab'))?.target).toBe('node-c');
    const edge = await diagram.model.getEdgeById('edge-ab');
    expect(edge).toMatchObject({ source: 'node-a', target: 'node-c', targetPort: 'port-left' });
    await expect(diagram.edge('edge-ab')).toBeAttached();
    await expect(diagram.edge('TEMPORARY_EDGE')).toHaveCount(0);

    await expect
      .poll(() => relinkEnded(diagram))
      .toEqual([
        {
          edge: 'edge-ab',
          end: 'target',
          success: true,
          reason: null,
          previousNode: 'node-b',
          target: 'node-c',
          targetPort: 'port-left',
        },
      ]);
  });

  test('dropping an endpoint on empty canvas reverts when dangling edges are off', async ({ diagram }) => {
    await diagram.load({ model: trio, config: relinkOn });
    await recordRelinkEnded(diagram);
    await diagram.selection.select([], ['edge-ab']);

    const handle = await diagram.centerOf(
      diagram.edge('edge-ab').locator('[data-relink-handle="target"]'),
      'target handle of edge-ab'
    );
    await diagram.beginDrag(handle, { x: handle.x + 150, y: handle.y + 160 });
    await diagram.page.mouse.up();

    const edge = await diagram.model.getEdgeById('edge-ab');
    expect(edge).toMatchObject({ source: 'node-a', target: 'node-b' });
    await expect
      .poll(() => relinkEnded(diagram))
      .toEqual([
        {
          edge: 'edge-ab',
          end: 'target',
          success: false,
          reason: 'noTarget',
          previousNode: 'node-b',
          target: null,
          targetPort: null,
        },
      ]);
  });

  test('dropping an endpoint on empty canvas detaches it when dangling edges are on', async ({ diagram }) => {
    await diagram.load({
      model: trio,
      config: { ...relinkOn, danglingEdges: { enabled: true } },
    });
    await diagram.selection.select([], ['edge-ab']);

    const handle = await diagram.centerOf(
      diagram.edge('edge-ab').locator('[data-relink-handle="target"]'),
      'target handle of edge-ab'
    );
    const drop = { x: handle.x + 150, y: handle.y + 160 };
    await diagram.beginDrag(handle, drop);
    await diagram.page.mouse.up();

    await expect.poll(async () => (await diagram.model.getEdgeById('edge-ab'))?.target).toBe('');
    const edge = await diagram.model.getEdgeById('edge-ab');
    const dropFlow = await diagram.viewport.clientToFlowPosition(drop);
    expect(edge?.targetPosition).toEqual(dropFlow);
    expect(edge?.source).toBe('node-a');
  });

  test('relinking the source endpoint works too', async ({ diagram }) => {
    await diagram.load({ model: trio, config: relinkOn });
    await diagram.selection.select([], ['edge-ab']);

    const handle = await diagram.centerOf(
      diagram.edge('edge-ab').locator('[data-relink-handle="source"]'),
      'source handle of edge-ab'
    );
    const dst = await diagram.centerOf(diagram.port('node-c', 'port-right'), 'port node-c/port-right');
    await diagram.beginDrag(handle, dst);
    await diagram.page.mouse.up();

    await expect.poll(async () => (await diagram.model.getEdgeById('edge-ab'))?.source).toBe('node-c');
    const edge = await diagram.model.getEdgeById('edge-ab');
    expect(edge).toMatchObject({ source: 'node-c', sourcePort: 'port-right', target: 'node-b' });
  });

  test('Escape cancels a relink and restores the edge', async ({ diagram }) => {
    await diagram.load({ model: trio, config: relinkOn });
    await recordRelinkEnded(diagram);
    await diagram.selection.select([], ['edge-ab']);

    const handle = await diagram.centerOf(
      diagram.edge('edge-ab').locator('[data-relink-handle="target"]'),
      'target handle of edge-ab'
    );
    await diagram.beginDrag(handle, { x: handle.x + 120, y: handle.y + 100 });
    await expect(diagram.edge('TEMPORARY_EDGE')).toBeAttached();

    await diagram.page.keyboard.press('Escape');

    await expect(diagram.edge('edge-ab')).toBeAttached();
    const edge = await diagram.model.getEdgeById('edge-ab');
    expect(edge).toMatchObject({ source: 'node-a', target: 'node-b' });
    await expect.poll(async () => (await relinkEnded(diagram)).length).toBe(1);
    expect((await relinkEnded(diagram))[0]).toMatchObject({ success: false, reason: 'cancelled' });

    // Listeners were removed on cancel: the release is inert.
    await diagram.page.mouse.up();
    await diagram.nextFrame();
    expect((await relinkEnded(diagram)).length).toBe(1);
  });
});

test.describe('startLinkingFromPosition', () => {
  test('a draw started from a position connects to a port on click', async ({ diagram }) => {
    await diagram.load({ model: pair });

    const portCenter = await diagram.centerOf(diagram.port('node-b', 'port-left'), 'port node-b/port-left');
    const startFlow = await diagram.viewport.clientToFlowPosition({ x: portCenter.x - 200, y: portCenter.y + 120 });

    await diagram.diagram.startLinkingFromPosition(startFlow);
    await diagram.page.mouse.move(portCenter.x - 100, portCenter.y + 60, { steps: 4 });
    await expect(diagram.edge('TEMPORARY_EDGE')).toBeAttached();
    await diagram.page.mouse.move(portCenter.x, portCenter.y, { steps: 4 });
    await diagram.page.mouse.click(portCenter.x, portCenter.y);

    await expect.poll(async () => (await diagram.model.edges()).length).toBe(1);
    const [edge] = await diagram.model.edges();
    expect(edge).toMatchObject({ source: '', target: 'node-b', targetPort: 'port-left' });
    expect(edge.sourcePosition).toEqual(startFlow);
  });

  test('a draw started from a position kept on empty canvas becomes a dual dangling edge', async ({ diagram }) => {
    await diagram.load({ model: pair, config: { danglingEdges: { enabled: true } } });

    const box = await diagram.container.boundingBox();
    const start = { x: box!.x + 500, y: box!.y + 400 };
    const end = { x: start.x + 140, y: start.y + 80 };
    const startFlow = await diagram.viewport.clientToFlowPosition(start);
    const endFlow = await diagram.viewport.clientToFlowPosition(end);

    await diagram.diagram.startLinkingFromPosition(startFlow);
    await diagram.page.mouse.move(end.x, end.y, { steps: 4 });
    await diagram.page.mouse.click(end.x, end.y);

    await expect.poll(async () => (await diagram.model.edges()).length).toBe(1);
    const [edge] = await diagram.model.edges();
    expect(edge).toMatchObject({ source: '', target: '' });
    expect(edge.sourcePosition).toEqual(startFlow);
    expect(edge.targetPosition).toEqual(endFlow);
  });

  test('a draw started from a position dropped on empty canvas is discarded when dangling edges are off', async ({
    diagram,
  }) => {
    await diagram.load({ model: pair });

    const box = await diagram.container.boundingBox();
    const start = { x: box!.x + 500, y: box!.y + 400 };
    const startFlow = await diagram.viewport.clientToFlowPosition(start);

    await diagram.diagram.startLinkingFromPosition(startFlow);
    await diagram.page.mouse.move(start.x + 120, start.y + 60, { steps: 4 });
    await diagram.page.mouse.click(start.x + 120, start.y + 60);

    await expect.poll(async () => (await diagram.model.edges()).length).toBe(0);
  });
});
