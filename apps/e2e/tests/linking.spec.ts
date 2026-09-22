import { expect, test, type Diagram } from './fixtures/diagram';
import { pair } from './fixtures/models';

/** Computed cursor of the element under a viewport point and whether that element belongs to the preview edge. */
function underPointer(diagram: Diagram, point: { x: number; y: number }) {
  return diagram.page.evaluate(
    ([x, y]) => {
      const el = document.elementFromPoint(x, y);
      return {
        cursor: el ? getComputedStyle(el).cursor : null,
        onPreview: !!el?.closest('[data-edge-id="TEMPORARY_EDGE"]'),
      };
    },
    [point.x, point.y] as const
  );
}

test.describe('linking', () => {
  test('dragging from one node port to another creates an edge', async ({ diagram }) => {
    await diagram.load({ model: pair });
    await expect(diagram.allEdges).toHaveCount(0);

    await diagram.linkPorts({ node: 'node-a', port: 'port-right' }, { node: 'node-b', port: 'port-left' });

    await expect(diagram.allEdges).toHaveCount(1);

    // The DOM count above can be satisfied by the temporary linking edge, and
    // the model signals refresh with change detection — poll instead of a
    // single-shot read to avoid racing the effect flush.
    await expect.poll(async () => (await diagram.model.edges()).length).toBe(1);

    const edges = await diagram.model.edges();
    expect(edges[0]).toMatchObject({ source: 'node-a', target: 'node-b' });
  });

  test('the preview edge never sits under the pointer and the host holds the grabbing cursor', async ({ diagram }) => {
    await diagram.load({ model: pair });
    const host = diagram.page.locator('ng-diagram');

    // Drag onto empty canvas below the nodes, then keep moving across it: the
    // preview ends exactly under the pointer at every step, so the element under
    // the pointer must be the canvas (cursor from the host), never the preview.
    const from = await diagram.centerOf(diagram.port('node-a', 'port-right'), 'port node-a/port-right');
    const nodeB = (await diagram.node('node-b').boundingBox())!;
    const start = { x: from.x + 40, y: nodeB.y + nodeB.height + 80 };
    await diagram.beginDrag(from, start);
    await expect(diagram.edge('TEMPORARY_EDGE')).toBeAttached();
    await expect(host).toHaveClass(/\blinking\b/);
    // The wrapper covers any edge template; the path opts back in, so it carries its own rule.
    await expect(diagram.edge('TEMPORARY_EDGE')).toHaveCSS('pointer-events', 'none');
    await expect(diagram.edge('TEMPORARY_EDGE').locator('svg path').first()).toHaveCSS('pointer-events', 'none');

    for (let step = 1; step <= 8; step++) {
      const point = { x: start.x + step * 15, y: start.y + step * 5 };
      await diagram.page.mouse.move(point.x, point.y);
      await diagram.nextFrame();
      expect(await underPointer(diagram, point), `step ${step}`).toEqual({ cursor: 'grabbing', onPreview: false });
    }

    const to = await diagram.centerOf(diagram.port('node-b', 'port-left'), 'port node-b/port-left');
    await diagram.page.mouse.move(to.x, to.y, { steps: 6 });
    await diagram.page.mouse.up();

    await expect(host).not.toHaveClass(/\blinking\b/);
    await expect.poll(async () => (await diagram.model.edges()).length).toBe(1);
    expect((await diagram.model.edges())[0]).toMatchObject({ source: 'node-a', target: 'node-b' });
  });
});
