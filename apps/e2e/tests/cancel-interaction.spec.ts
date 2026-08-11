import type { Model } from 'ng-diagram';
import { expect, test } from './fixtures/diagram';
import type { Diagram } from './fixtures/diagram';
import { pair, spin } from './fixtures/models';

/**
 * cancelActiveInteraction() and its default Escape binding: every gesture
 * (drag, linking, resize, rotate, pan) aborts immediately — the touched state
 * rolls back, document-level listeners are gone before the pointer release,
 * the gesture-ended events carry the cancelled reason — and Escape stays
 * non-intrusive when there is nothing to cancel.
 */

/** Record every gesture-ended event as `kind:reason`, in emission order. */
const recordEndedEvents = (diagram: Diagram) =>
  diagram.page.evaluate(() => {
    const stash = window as unknown as { __endedEvents?: string[] };
    stash.__endedEvents = [];
    const service = window.__diagram!.diagram;
    service.addEventListener('nodeDragEnded', (e) =>
      stash.__endedEvents!.push(`drag:${e.cancelReason ?? 'completed'}`)
    );
    service.addEventListener('nodeResizeEnded', (e) =>
      stash.__endedEvents!.push(`resize:${e.cancelReason ?? 'completed'}`)
    );
    service.addEventListener('nodeRotateEnded', (e) =>
      stash.__endedEvents!.push(`rotate:${e.cancelReason ?? 'completed'}`)
    );
    service.addEventListener('edgeDrawEnded', (e) =>
      stash.__endedEvents!.push(`link:${e.success ? 'drawn' : (e.reason ?? 'none')}`)
    );
  });

const endedEvents = (diagram: Diagram) =>
  diagram.page.evaluate(() => (window as unknown as { __endedEvents?: string[] }).__endedEvents ?? []);

/** 200×120 box at (100,100) with fixed size — resize rollback is exact. */
const box: Partial<Model> = {
  nodes: [
    {
      id: 'box',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 120 },
      autoSize: false,
      resizable: true,
      data: { label: 'box' },
    },
  ],
  edges: [],
};

/** Auto-sized node — the resize gesture disables autoSize, cancel must bring it back. */
const autoBox: Partial<Model> = {
  nodes: [
    {
      id: 'auto',
      position: { x: 100, y: 100 },
      autoSize: true,
      resizable: true,
      data: { label: 'auto' },
    },
  ],
  edges: [],
};

test.describe('Escape cancels the in-flight gesture', () => {
  test('drag: nodes snap back, listeners are gone, nodeDragEnded reports cancelled', async ({ diagram }) => {
    await diagram.load({ model: pair });
    await recordEndedEvents(diagram);
    const before = await diagram.nodePosition('node-a');

    const start = await diagram.centerOf(diagram.node('node-a'), 'node "node-a"');
    await diagram.beginDrag(start, { x: start.x + 90, y: start.y + 60 });
    await expect.poll(() => diagram.nodePosition('node-a')).not.toEqual(before);

    await diagram.page.keyboard.press('Escape');

    await expect.poll(() => diagram.nodePosition('node-a')).toEqual(before);
    await expect.poll(() => endedEvents(diagram)).toEqual(['drag:cancelled']);
    await expect.poll(async () => (await diagram.diagram.actionState()).dragging).toBeUndefined();
    // Cancel aborts the move and nothing else — the selection stays
    expect((await diagram.model.getNodeById('node-a'))?.selected).toBe(true);

    // Listeners were removed on cancel: further moves and the release are inert
    await diagram.page.mouse.move(start.x + 200, start.y + 150, { steps: 4 });
    await diagram.nextFrame();
    expect(await diagram.nodePosition('node-a')).toEqual(before);
    await diagram.page.mouse.up();
    await diagram.nextFrame();
    expect(await endedEvents(diagram)).toEqual(['drag:cancelled']);
  });

  test('linking: the temporary edge is discarded and edgeDrawEnded reports cancelled', async ({ diagram }) => {
    await diagram.load({ model: pair });
    await recordEndedEvents(diagram);

    const from = await diagram.centerOf(diagram.port('node-a', 'port-right'), 'port node-a/port-right');
    await diagram.beginDrag(from, { x: from.x + 120, y: from.y + 90 });
    await expect(diagram.edge('TEMPORARY_EDGE')).toBeAttached();

    await diagram.page.keyboard.press('Escape');

    await expect(diagram.allEdges).toHaveCount(0);
    await expect.poll(() => endedEvents(diagram)).toEqual(['link:cancelled']);
    await expect.poll(async () => (await diagram.diagram.actionState()).linking).toBeUndefined();

    await diagram.page.mouse.up();
    await diagram.nextFrame();
    expect(await diagram.model.edges()).toEqual([]);
    expect(await endedEvents(diagram)).toEqual(['link:cancelled']);
  });

  test('resize: size and position roll back exactly, nodeResizeEnded reports cancelled', async ({ diagram }) => {
    await diagram.load({ model: box });
    await recordEndedEvents(diagram);
    await diagram.node('box').click();

    // Top-left handle changes both size and position — rollback must restore both
    const handle = await diagram.centerOf(
      diagram.node('box').locator('.resize-handle--top-left'),
      'top-left resize handle'
    );
    await diagram.beginDrag(handle, { x: handle.x + 30, y: handle.y + 20 });
    await expect
      .poll(async () => (await diagram.model.getNodeById('box'))?.size)
      .not.toEqual({
        width: 200,
        height: 120,
      });

    await diagram.page.keyboard.press('Escape');

    await expect.poll(async () => (await diagram.model.getNodeById('box'))?.size).toEqual({ width: 200, height: 120 });
    expect((await diagram.model.getNodeById('box'))?.position).toEqual({ x: 100, y: 100 });
    await expect.poll(() => endedEvents(diagram)).toEqual(['resize:cancelled']);

    await diagram.page.mouse.up();
    await diagram.nextFrame();
    expect(await endedEvents(diagram)).toEqual(['resize:cancelled']);
  });

  test('resize: Escape works when the gesture starts with focus outside the diagram', async ({ diagram }) => {
    await diagram.load({ model: box });
    await diagram.node('box').click();
    // Focus leaves the diagram — like clicking a toolbar button right before resizing.
    // The resize handle stops pointerdown propagation, so only the capture-phase
    // focus grab brings the keyboard back to the diagram.
    await diagram.page.evaluate(() => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();
    });

    const handle = await diagram.centerOf(
      diagram.node('box').locator('.resize-handle--bottom-right'),
      'bottom-right resize handle'
    );
    await diagram.beginDrag(handle, { x: handle.x + 40, y: handle.y + 30 });
    await expect
      .poll(async () => (await diagram.model.getNodeById('box'))?.size)
      .not.toEqual({
        width: 200,
        height: 120,
      });

    await diagram.page.keyboard.press('Escape');

    await expect.poll(async () => (await diagram.model.getNodeById('box'))?.size).toEqual({ width: 200, height: 120 });
    await diagram.page.mouse.up();
  });

  test('resize: a cancelled gesture gives autoSize back', async ({ diagram }) => {
    await diagram.load({ model: autoBox });
    await diagram.node('auto').click();
    // Wait for the measured size — autoSize nodes get their size from the DOM
    await expect.poll(async () => (await diagram.model.getNodeById('auto'))?.size).toBeDefined();
    const measured = (await diagram.model.getNodeById('auto'))!.size;

    const handle = await diagram.centerOf(
      diagram.node('auto').locator('.resize-handle--bottom-right'),
      'bottom-right resize handle'
    );
    await diagram.beginDrag(handle, { x: handle.x + 40, y: handle.y + 30 });
    await expect.poll(async () => (await diagram.model.getNodeById('auto'))?.autoSize).toBe(false);

    await diagram.page.keyboard.press('Escape');

    await expect.poll(async () => (await diagram.model.getNodeById('auto'))?.autoSize).toBe(true);
    await expect.poll(async () => (await diagram.model.getNodeById('auto'))?.size).toEqual(measured);
    await diagram.page.mouse.up();
  });

  test('rotate: the angle rolls back exactly, nodeRotateEnded reports cancelled', async ({ diagram }) => {
    await diagram.load({ model: spin });
    await recordEndedEvents(diagram);
    await diagram.node('spin').click();

    const handle = await diagram.centerOf(diagram.node('spin').locator('.ng-diagram-rotate-handle'), 'rotate handle');
    await diagram.beginDrag(handle, { x: handle.x + 120, y: handle.y + 120 });
    await expect.poll(async () => (await diagram.model.getNodeById('spin'))?.angle).not.toBe(30);

    await diagram.page.keyboard.press('Escape');

    await expect.poll(async () => (await diagram.model.getNodeById('spin'))?.angle).toBe(30);
    await expect.poll(() => endedEvents(diagram)).toEqual(['rotate:cancelled']);

    await diagram.page.mouse.up();
    await diagram.nextFrame();
    expect(await endedEvents(diagram)).toEqual(['rotate:cancelled']);
  });

  test('pan: the gesture stops but the viewport is NOT rolled back', async ({ diagram }) => {
    await diagram.load({ model: pair });
    const initial = await diagram.viewport.viewport();

    const containerBox = await diagram.container.boundingBox();
    if (!containerBox) throw new Error('container has no bounding box');
    const corner = {
      x: containerBox.x + containerBox.width - 30,
      y: containerBox.y + containerBox.height - 30,
    };
    await diagram.beginDrag(corner, { x: corner.x - 60, y: corner.y - 40 });
    await expect.poll(async () => (await diagram.viewport.viewport()).x).not.toBe(initial.x);

    await diagram.page.keyboard.press('Escape');

    await expect.poll(async () => (await diagram.diagram.actionState()).panning).toBeUndefined();
    const frozen = await diagram.viewport.viewport();
    expect(frozen).not.toEqual(initial); // navigation state is deliberately kept

    // Listeners were removed on cancel: further moves and the release are inert
    await diagram.page.mouse.move(corner.x - 200, corner.y - 150, { steps: 4 });
    await diagram.nextFrame();
    expect(await diagram.viewport.viewport()).toEqual(frozen);
    await diagram.page.mouse.up();
    await diagram.nextFrame();
    expect(await diagram.viewport.viewport()).toEqual(frozen);
  });
});

test.describe('cancelActiveInteraction()', () => {
  test('aborts a pointer drag programmatically and resolves true', async ({ diagram }) => {
    await diagram.load({ model: pair });
    const before = await diagram.nodePosition('node-a');

    const start = await diagram.centerOf(diagram.node('node-a'), 'node "node-a"');
    await diagram.beginDrag(start, { x: start.x + 80, y: start.y + 50 });
    await expect.poll(() => diagram.nodePosition('node-a')).not.toEqual(before);

    expect(await diagram.diagram.cancelActiveInteraction()).toBe(true);

    await expect.poll(() => diagram.nodePosition('node-a')).toEqual(before);
    await diagram.page.mouse.up();
  });

  test('aborts manual linking started via startLinking()', async ({ diagram }) => {
    await diagram.load({ model: pair });

    await diagram.page.evaluate(() => {
      const node = window.__diagram!.model.getNodeById('node-a');
      window.__diagram!.diagram.startLinking(node!, 'port-right');
    });
    await diagram.page.mouse.move(300, 300);
    await expect(diagram.edge('TEMPORARY_EDGE')).toBeAttached();

    expect(await diagram.diagram.cancelActiveInteraction()).toBe(true);

    await expect(diagram.allEdges).toHaveCount(0);
    // The manual-linking document listeners are gone: a click completes nothing
    await diagram.clickCanvas();
    await diagram.nextFrame();
    expect(await diagram.model.edges()).toEqual([]);
  });

  test('resolves false and emits nothing when no gesture is active', async ({ diagram }) => {
    await diagram.load({ model: pair });
    await recordEndedEvents(diagram);

    expect(await diagram.diagram.cancelActiveInteraction()).toBe(false);

    await diagram.nextFrame();
    expect(await endedEvents(diagram)).toEqual([]);
  });
});

test.describe('Escape stays non-intrusive', () => {
  test('the key is swallowed only while something is cancellable', async ({ diagram }) => {
    await diagram.load({ model: pair });
    // Registered after the library's own document listener, so it observes the
    // final defaultPrevented verdict for every Escape press
    await diagram.page.evaluate(() => {
      const stash = window as unknown as { __escSwallowed?: boolean[] };
      stash.__escSwallowed = [];
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') stash.__escSwallowed!.push(e.defaultPrevented);
      });
    });

    // Focus the diagram without leaving any gesture active…
    await diagram.clickCanvas();
    await diagram.page.keyboard.press('Escape'); // …nothing to cancel → not swallowed

    const start = await diagram.centerOf(diagram.node('node-a'), 'node "node-a"');
    await diagram.beginDrag(start, { x: start.x + 60, y: start.y + 40 });
    await diagram.page.keyboard.press('Escape'); // mid-drag → swallowed
    await diagram.page.mouse.up();

    // A normally completed gesture must leave nothing cancellable behind —
    // a lingering interaction registration would swallow this Escape too
    await diagram.dragNode('node-a', { x: 40, y: 30 });
    await diagram.page.keyboard.press('Escape');

    await expect
      .poll(() => diagram.page.evaluate(() => (window as unknown as { __escSwallowed?: boolean[] }).__escSwallowed))
      .toEqual([false, true, false]);
  });
});
