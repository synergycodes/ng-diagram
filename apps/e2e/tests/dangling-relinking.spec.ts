import type { Model } from 'ng-diagram';
import { expect, test, type Diagram } from './fixtures/diagram';
import { pair, trio } from './fixtures/models';

/**
 * Dangling edges (config `danglingEdges`) and edge relinking
 * (config `linking.defaultRelinkable`, overridable per edge with
 * `edge.relinkable`) — both opt-in, default off.
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

/** Record every edgeDrawEnded payload on the page for later assertions. */
async function recordDrawEnded(diagram: Diagram): Promise<void> {
  await diagram.page.evaluate(() => {
    const events: unknown[] = [];
    (window as unknown as Record<string, unknown>).__drawEnded = events;
    window.__diagram!.diagram.addEventListener('edgeDrawEnded', (event) => {
      events.push({ success: event.success, reason: event.reason ?? null });
    });
  });
}

function drawEnded(diagram: Diagram): Promise<unknown[]> {
  return diagram.page.evaluate(() => (window as unknown as Record<string, unknown>).__drawEnded as unknown[]);
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

  test('link drop on a port the edge cannot connect to keeps no dangling edge', async ({ diagram }) => {
    await diagram.load({ model: pair, config: { danglingEdges: { enabled: true } } });
    await recordDrawEnded(diagram);

    // The draw's own source port can never become its target, so the preview
    // never snaps back to it — the release over it is a refused connection,
    // not a drop on empty canvas.
    const from = await diagram.centerOf(diagram.port('node-a', 'port-right'), 'port node-a/port-right');
    await diagram.beginDrag(from, { x: from.x + 200, y: from.y + 140 });
    await diagram.page.mouse.move(from.x, from.y, { steps: 4 });
    await diagram.page.mouse.up();

    await expect.poll(() => drawEnded(diagram)).toEqual([{ success: false, reason: 'noTarget' }]);
    expect(await diagram.model.edges()).toEqual([]);
    await expect(diagram.allEdges).toHaveCount(0);
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

    // The selectionRemoved payload reports the demoted edges.
    await diagram.page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__detached = [];
      window.__diagram!.diagram.addEventListener('selectionRemoved', (event) => {
        ((window as unknown as Record<string, unknown>).__detached as unknown[]).push(
          event.detachedEdges.map((edge) => edge.id)
        );
      });
    });

    // The freed endpoint stays anchored exactly where the edge ended before the delete.
    const before = await diagram.model.getEdgeById('edge-ab');
    const expectedAnchor = before!.points!.at(-1);

    await diagram.selection.select(['node-b']);
    await diagram.selection.deleteSelection();

    await expect.poll(async () => (await diagram.model.getNodeById('node-b')) === null).toBe(true);

    const edges = await diagram.model.edges();
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ id: 'edge-ab', source: 'node-a', target: '' });
    expect(edges[0].targetPosition).toEqual(expectedAnchor);
    await expect(diagram.edge('edge-ab')).toHaveClass(/ng-diagram-edge--dangling/);

    await expect
      .poll(() => diagram.page.evaluate(() => (window as unknown as Record<string, unknown>).__detached))
      .toEqual([['edge-ab']]);
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
  const relinkOn = { linking: { defaultRelinkable: true } };

  test('handles render only on selected edges and only when enabled', async ({ diagram }) => {
    await diagram.load({ model: trio });
    await diagram.selection.select([], ['edge-ab']);
    await expect(diagram.page.locator('[data-relink-handle]')).toHaveCount(0);

    await diagram.load({ model: trio, config: relinkOn });
    await expect(diagram.page.locator('[data-relink-handle]')).toHaveCount(0);
    await diagram.selection.select([], ['edge-ab']);
    await expect(diagram.page.locator('[data-relink-handle]')).toHaveCount(2);
  });

  /** The trio model with `edge-ab` carrying the given `relinkable` value. */
  const trioWithRelinkable = (relinkable: boolean | 'source' | 'target'): Partial<Model> => ({
    nodes: trio.nodes,
    edges: trio.edges!.map((edge) => ({ ...edge, relinkable })),
  });

  test("an edge with relinkable 'target' shows only the target handle and still reconnects", async ({ diagram }) => {
    await diagram.load({ model: trioWithRelinkable('target'), config: relinkOn });
    await diagram.selection.select([], ['edge-ab']);

    await expect(diagram.page.locator('[data-relink-handle]')).toHaveCount(1);
    await expect(diagram.page.locator('[data-relink-handle="source"]')).toHaveCount(0);

    const handle = await diagram.centerOf(
      diagram.edge('edge-ab').locator('[data-relink-handle="target"]'),
      'target handle of edge-ab'
    );
    const dst = await diagram.centerOf(diagram.port('node-c', 'port-left'), 'port node-c/port-left');
    await diagram.beginDrag(handle, dst);
    await diagram.page.mouse.up();

    await expect.poll(async () => (await diagram.model.getEdgeById('edge-ab'))?.target).toBe('node-c');
  });

  test('an edge with relinkable false shows no handles and cannot be relinked', async ({ diagram }) => {
    await diagram.load({ model: trioWithRelinkable(false), config: relinkOn });
    await diagram.page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__relinkStarted = 0;
      window.__diagram!.diagram.addEventListener('edgeRelinkStarted', () => {
        (window as unknown as Record<string, number>).__relinkStarted += 1;
      });
    });
    // Where the target handle would sit: the edge's last routed point.
    const edge = await diagram.model.getEdgeById('edge-ab');
    const handle = await diagram.viewport.flowToClientPosition(edge!.points!.at(-1)!);

    await diagram.selection.select([], ['edge-ab']);
    await expect(diagram.page.locator('[data-relink-handle]')).toHaveCount(0);

    await diagram.beginDrag(handle, { x: handle.x + 120, y: handle.y + 100 });
    await diagram.page.mouse.up();
    await diagram.nextFrame();

    expect(await diagram.page.evaluate(() => (window as unknown as Record<string, number>).__relinkStarted)).toBe(0);
    expect(await diagram.model.getEdgeById('edge-ab')).toMatchObject({ source: 'node-a', target: 'node-b' });
  });

  test('an edge with relinkable true shows both handles although the default is false', async ({ diagram }) => {
    await diagram.load({ model: trioWithRelinkable(true) });
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
    // Pause over empty canvas on the way (below the lowest node): the preview
    // ends under the pointer there, so it must not be the element under the pointer.
    const nodeC = (await diagram.node('node-c').boundingBox())!;
    const canvasPoint = { x: handle.x + 60, y: nodeC.y + nodeC.height + 80 };
    await diagram.beginDrag(handle, canvasPoint);
    // The original edge is hidden during the drag and replaced by the preview.
    await expect(diagram.edge('TEMPORARY_EDGE')).toBeAttached();
    await expect(diagram.edge('edge-ab')).toHaveCount(0);
    await expect(diagram.page.locator('ng-diagram')).toHaveClass(/relinking/);
    await expect(diagram.edge('TEMPORARY_EDGE').locator('svg path').first()).toHaveCSS('pointer-events', 'none');
    expect(
      await diagram.page.evaluate(
        ([x, y]) => {
          const el = document.elementFromPoint(x, y);
          return {
            cursor: el ? getComputedStyle(el).cursor : null,
            onPreview: !!el?.closest('[data-edge-id="TEMPORARY_EDGE"]'),
          };
        },
        [canvasPoint.x, canvasPoint.y] as const
      )
    ).toEqual({ cursor: 'grabbing', onPreview: false });

    await diagram.page.mouse.move(dst.x, dst.y, { steps: 6 });
    await diagram.page.mouse.up();
    await expect(diagram.page.locator('ng-diagram')).not.toHaveClass(/relinking/);

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
    const edge = await diagram.model.getEdgeById('edge-ab');
    expect(edge).toMatchObject({ source: 'node-a', target: 'node-b' });
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

  test('dropping an endpoint on a port that cannot take it reverts with invalidConnection', async ({ diagram }) => {
    await diagram.load({
      model: trio,
      config: { ...relinkOn, danglingEdges: { enabled: true } },
    });
    await recordRelinkEnded(diagram);
    await diagram.selection.select([], ['edge-ab']);

    const handle = await diagram.centerOf(
      diagram.edge('edge-ab').locator('[data-relink-handle="target"]'),
      'target handle of edge-ab'
    );
    // node-a is the edge's own source, so none of its ports can become the
    // target end — a refused connection, not a drop on empty canvas.
    const dst = await diagram.centerOf(diagram.port('node-a', 'port-left'), 'port node-a/port-left');
    await diagram.beginDrag(handle, dst);
    await diagram.page.mouse.up();

    await expect
      .poll(() => relinkEnded(diagram))
      .toEqual([
        {
          edge: 'edge-ab',
          end: 'target',
          success: false,
          reason: 'invalidConnection',
          previousNode: 'node-b',
          target: null,
          targetPort: null,
        },
      ]);
    const edge = await diagram.model.getEdgeById('edge-ab');
    expect(edge).toMatchObject({ source: 'node-a', target: 'node-b' });
    expect(edge?.target).not.toBe('');
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
  test('a click on a handle without dragging changes nothing and emits nothing', async ({ diagram }) => {
    await diagram.load({
      model: trio,
      config: { ...relinkOn, danglingEdges: { enabled: true } },
    });
    await recordRelinkEnded(diagram);
    await diagram.selection.select([], ['edge-ab']);

    const handle = await diagram.centerOf(
      diagram.edge('edge-ab').locator('[data-relink-handle="target"]'),
      'target handle of edge-ab'
    );
    await diagram.page.mouse.move(handle.x, handle.y);
    await diagram.page.mouse.down();
    await diagram.page.mouse.up();
    await diagram.nextFrame();

    const edge = await diagram.model.getEdgeById('edge-ab');
    expect(edge).toMatchObject({ source: 'node-a', target: 'node-b' });
    expect(await relinkEnded(diagram)).toEqual([]);
    // The edge stayed rendered the whole time — no gesture, no hidden original.
    await expect(diagram.edge('edge-ab')).toBeAttached();
  });

  test('a drop back on the original endpoint reverts without changing the model', async ({ diagram }) => {
    // The edge must be port-connected: "the original endpoint" means the same
    // node AND port (a port-less endpoint dropped onto a port is a real change).
    const trioWithPorts: Partial<Model> = {
      nodes: trio.nodes,
      edges: [
        {
          id: 'edge-ab',
          source: 'node-a',
          sourcePort: 'port-right',
          target: 'node-b',
          targetPort: 'port-left',
          data: {},
        },
      ],
    };
    await diagram.load({ model: trioWithPorts, config: relinkOn });
    await recordRelinkEnded(diagram);
    await diagram.selection.select([], ['edge-ab']);

    const handle = await diagram.centerOf(
      diagram.edge('edge-ab').locator('[data-relink-handle="target"]'),
      'target handle of edge-ab'
    );
    // Drag away (past the threshold) and come back to the original endpoint.
    await diagram.beginDrag(handle, { x: handle.x + 120, y: handle.y + 90 });
    await diagram.page.mouse.move(handle.x, handle.y, { steps: 4 });
    await diagram.page.mouse.up();

    await expect.poll(async () => (await relinkEnded(diagram)).length).toBe(1);
    expect((await relinkEnded(diagram))[0]).toMatchObject({ success: false, reason: 'cancelled' });
    const edge = await diagram.model.getEdgeById('edge-ab');
    expect(edge).toMatchObject({ source: 'node-a', target: 'node-b', targetPort: 'port-left' });
  });

  test('shift+drag on a handle box-selects instead of relinking', async ({ diagram }) => {
    await diagram.load({ model: trio, config: relinkOn });
    await recordRelinkEnded(diagram);
    await diagram.selection.select([], ['edge-ab']);

    const handle = await diagram.centerOf(
      diagram.edge('edge-ab').locator('[data-relink-handle="target"]'),
      'target handle of edge-ab'
    );
    await diagram.page.keyboard.down('Shift');
    await diagram.beginDrag(handle, { x: handle.x + 120, y: handle.y + 100 });
    await diagram.page.mouse.up();
    await diagram.page.keyboard.up('Shift');

    const edge = await diagram.model.getEdgeById('edge-ab');
    expect(edge).toMatchObject({ source: 'node-a', target: 'node-b' });
    expect(await relinkEnded(diagram)).toEqual([]);
  });

  test('the diagram host carries the relinking class only while dragging', async ({ diagram }) => {
    await diagram.load({ model: trio, config: relinkOn });
    await diagram.selection.select([], ['edge-ab']);
    const host = diagram.page.locator('ng-diagram');

    const handle = await diagram.centerOf(
      diagram.edge('edge-ab').locator('[data-relink-handle="target"]'),
      'target handle of edge-ab'
    );
    await expect(host).not.toHaveClass(/relinking/);
    await diagram.beginDrag(handle, { x: handle.x + 100, y: handle.y + 80 });
    await expect(host).toHaveClass(/relinking/);
    await diagram.page.mouse.up();
    await expect(host).not.toHaveClass(/relinking/);

    // Escape clears it too.
    await diagram.selection.select([], ['edge-ab']);
    const handleAgain = await diagram.centerOf(
      diagram.edge('edge-ab').locator('[data-relink-handle="target"]'),
      'target handle of edge-ab'
    );
    await diagram.beginDrag(handleAgain, { x: handleAgain.x + 100, y: handleAgain.y + 80 });
    await expect(host).toHaveClass(/relinking/);
    await diagram.page.keyboard.press('Escape');
    await expect(host).not.toHaveClass(/relinking/);
    await diagram.page.mouse.up();
  });

  test('validateConnection sees reason "relink" and can reject the drop', async ({ diagram }) => {
    await diagram.load({ model: trio, config: relinkOn });
    await recordRelinkEnded(diagram);
    await diagram.page.evaluate(() => {
      window.__diagram!.diagram.updateConfig({
        linking: {
          validateConnection: (
            _source: unknown,
            _sourcePort: unknown,
            _target: unknown,
            _targetPort: unknown,
            context?: { reason?: string }
          ) => context?.reason !== 'relink',
        },
      });
    });
    await diagram.selection.select([], ['edge-ab']);

    const handle = await diagram.centerOf(
      diagram.edge('edge-ab').locator('[data-relink-handle="target"]'),
      'target handle of edge-ab'
    );
    const dst = await diagram.centerOf(diagram.port('node-c', 'port-left'), 'port node-c/port-left');
    await diagram.beginDrag(handle, dst);
    await diagram.page.mouse.up();

    await expect.poll(async () => (await relinkEnded(diagram)).length).toBe(1);
    expect((await relinkEnded(diagram))[0]).toMatchObject({ success: false, reason: 'invalidConnection' });
    const edge = await diagram.model.getEdgeById('edge-ab');
    expect(edge).toMatchObject({ source: 'node-a', target: 'node-b' });

    // The same validator still allows drawing new edges from a port.
    await diagram.selection.deselectAll();
    await diagram.linkPorts({ node: 'node-a', port: 'port-right' }, { node: 'node-c', port: 'port-left' });
    await expect.poll(async () => (await diagram.model.edges()).length).toBe(2);
  });

  test('the hit area keeps its screen size at low zoom and highlights the handle', async ({ diagram }) => {
    await diagram.load({ model: trio, config: relinkOn });
    await diagram.viewport.zoom(0.5);
    await diagram.selection.select([], ['edge-ab']);

    const visible = diagram.edge('edge-ab').locator('[data-relink-handle="target"]');
    const handle = await diagram.centerOf(visible, 'target handle of edge-ab');
    // At zoom 0.5 the visible circle is 2.5px in radius, so 9px above its
    // center only the 12px hit circle can be under the pointer.
    const ring = { x: handle.x, y: handle.y - 9 };
    const under = await diagram.page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.getAttribute('class') ?? null,
      ring
    );
    expect(under).toContain('ng-diagram-edge__relink-handle-hit');

    // Hovering the hit area highlights the visible circle exactly like hovering the circle itself.
    const fill = () => visible.evaluate((element) => getComputedStyle(element).fill);
    const restFill = await fill();
    await diagram.page.mouse.move(handle.x, handle.y);
    await expect.poll(fill).not.toBe(restFill);
    const hoverFill = await fill();
    await diagram.page.mouse.move(ring.x, ring.y);
    await expect.poll(fill).toBe(hoverFill);
  });
});

test.describe('edge relinking on touch', () => {
  test.use({ hasTouch: true });

  const relinkOn = { linking: { defaultRelinkable: true } };

  /** Dispatch a raw CDP touch sequence (Playwright's touchscreen has no drag). */
  async function touchSequence(
    diagram: Diagram,
    points: { x: number; y: number }[],
    last: 'touchEnd' | 'touchCancel'
  ): Promise<void> {
    const cdp = await diagram.page.context().newCDPSession(diagram.page);
    const [start, ...moves] = points;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...start, id: 1 }] });
    for (const move of moves) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...move, id: 1 }] });
      await diagram.nextFrame();
    }
    await cdp.send('Input.dispatchTouchEvent', { type: last, touchPoints: [] });
    await cdp.detach();
  }

  test('a touch drag of the target handle reconnects the edge', async ({ diagram }) => {
    await diagram.load({ model: trio, config: relinkOn });
    await diagram.selection.select([], ['edge-ab']);

    const handle = await diagram.centerOf(
      diagram.edge('edge-ab').locator('[data-relink-handle="target"]'),
      'target handle of edge-ab'
    );
    const dst = await diagram.centerOf(diagram.port('node-c', 'port-left'), 'port node-c/port-left');
    await touchSequence(
      diagram,
      [handle, { x: (handle.x + dst.x) / 2, y: (handle.y + dst.y) / 2 }, dst, dst],
      'touchEnd'
    );

    await expect.poll(async () => (await diagram.model.getEdgeById('edge-ab'))?.target).toBe('node-c');
  });

  test('a cancelled touch reverts the relink', async ({ diagram }) => {
    await diagram.load({ model: trio, config: relinkOn });
    await recordRelinkEnded(diagram);
    await diagram.selection.select([], ['edge-ab']);

    const handle = await diagram.centerOf(
      diagram.edge('edge-ab').locator('[data-relink-handle="target"]'),
      'target handle of edge-ab'
    );
    await touchSequence(diagram, [handle, { x: handle.x + 90, y: handle.y + 70 }], 'touchCancel');

    await expect.poll(async () => (await relinkEnded(diagram)).length).toBe(1);
    expect((await relinkEnded(diagram))[0]).toMatchObject({ success: false, reason: 'cancelled' });
    const edge = await diagram.model.getEdgeById('edge-ab');
    expect(edge).toMatchObject({ source: 'node-a', target: 'node-b' });
    // The gesture released its claim: a fresh port draw works right away.
    await diagram.selection.deselectAll();
    await expect.poll(async () => (await diagram.diagram.actionState()).linking).toBeFalsy();
  });
});

test.describe('startLinkingFromPosition', () => {
  test('a draw started from a position connects to a port on click', async ({ diagram }) => {
    // startLinkingFromPosition requires the dangling-edges feature: the drawn
    // edge has an empty source by construction.
    await diagram.load({ model: pair, config: { danglingEdges: { enabled: true } } });

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
    // A free end has no port: undefined, never the preview's ''.
    expect(edge.sourcePort).toBeUndefined();
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

  test('startLinkingFromPosition is refused when dangling edges are off', async ({ diagram }) => {
    await diagram.load({ model: pair });

    const box = await diagram.container.boundingBox();
    const start = { x: box!.x + 500, y: box!.y + 400 };
    const startFlow = await diagram.viewport.clientToFlowPosition(start);

    // The call is ignored with a console warning — no draw starts at all.
    await diagram.diagram.startLinkingFromPosition(startFlow);
    await diagram.page.mouse.move(start.x + 120, start.y + 60, { steps: 4 });
    await expect(diagram.edge('TEMPORARY_EDGE')).toHaveCount(0);
    await diagram.page.mouse.click(start.x + 120, start.y + 60);

    await expect.poll(async () => (await diagram.model.edges()).length).toBe(0);
  });
});
