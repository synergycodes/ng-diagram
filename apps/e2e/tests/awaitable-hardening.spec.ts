import { expect, test } from './fixtures/diagram';
import { pair, trio } from './fixtures/models';

/**
 * Regression guards for the awaitable-emits hardening: real-gesture races
 * (fast re-drag, delete mid-resize, consecutive links) and failure-path
 * behavior (throwing middleware, orphaned transactions, measurement-tracking
 * hijack) that unit tests can only approximate with mocks.
 */

const positionOf = async (diagram: import('./fixtures/diagram').Diagram, id: string) => {
  const node = await diagram.model.getNodeById(id);
  if (!node) throw new Error(`node "${id}" not in model`);
  return { x: node.position.x, y: node.position.y };
};

const centerOfNode = async (diagram: import('./fixtures/diagram').Diagram, id: string) => {
  const box = await diagram.node(id).boundingBox();
  if (!box) throw new Error(`node "${id}" has no bounding box`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

/** Record nodeDragStarted/nodeDragEnded as `started:idA+idB` strings, in emission order. */
const recordDragEvents = (diagram: import('./fixtures/diagram').Diagram) =>
  diagram.page.evaluate(() => {
    const stash = window as unknown as { __dragEvents?: string[] };
    stash.__dragEvents = [];
    const record = (type: string) => (event: { nodes: { id: string }[] }) => {
      stash.__dragEvents!.push(`${type}:${event.nodes.map((n) => n.id).join('+')}`);
    };
    window.__diagram!.diagram.addEventListener('nodeDragStarted', record('started'));
    window.__diagram!.diagram.addEventListener('nodeDragEnded', record('ended'));
  });

const recordedDragEvents = (diagram: import('./fixtures/diagram').Diagram) =>
  diagram.page.evaluate(() => (window as unknown as { __dragEvents?: string[] }).__dragEvents ?? []);

test.describe('awaitable hardening', () => {
  test('fast re-drag under a slow middleware applies both drags exactly', async ({ diagram }) => {
    await diagram.load({ model: pair });
    const before = await positionOf(diagram, 'node-a');

    // Slow ONLY the drag end-phase pass (moveNodesStop) so the first drag's
    // cleanup is genuinely suspended when the second drag starts — an unguarded
    // suspended cleanup would clobber the second drag's state. Slowing every pass
    // would also throttle the dozens of moveNodesBy passes and make timing,
    // not the guarded race, dominate the test.
    await diagram.page.evaluate(() => {
      const stash = window as unknown as { __unregisterSlow?: () => void };
      stash.__unregisterSlow = window.__diagram!.diagram.registerMiddleware({
        name: 'e2e-slow-drag-end',
        execute: async (context, next) => {
          if (context.modelActionTypes.includes('moveNodesStop')) {
            await new Promise((resolve) => setTimeout(resolve, 60));
          }
          await next();
        },
      });
    });

    try {
      await diagram.dragNode('node-a', { x: 80, y: 40 });
      // Immediately re-drag — no settling wait in between.
      await diagram.dragNode('node-a', { x: 60, y: -20 });

      // Tolerance covers sub-pixel grab inaccuracy of the second drag; a dead
      // second gesture (the guarded regression) would leave dx at ~80.
      await expect
        .poll(async () => {
          const after = await positionOf(diagram, 'node-a');
          return Math.abs(after.x - before.x - 140) <= 6 && Math.abs(after.y - before.y - 20) <= 6;
        })
        .toBe(true);
    } finally {
      await diagram.page.evaluate(() => (window as unknown as { __unregisterSlow?: () => void }).__unregisterSlow?.());
    }
  });

  test('a release during the suspended drag-start pass leaves the node unmoved', async ({ diagram }) => {
    await diagram.load({ model: pair });
    await recordDragEvents(diagram);
    const before = await positionOf(diagram, 'node-a');

    // Slow ONLY the moveNodesStart pass: the first threshold-crossing continue
    // awaits that emit, so the release below lands while it is suspended.
    await diagram.page.evaluate(() => {
      const stash = window as unknown as { __unregisterSlowStart?: () => void };
      stash.__unregisterSlowStart = window.__diagram!.diagram.registerMiddleware({
        name: 'e2e-slow-drag-start',
        execute: async (context, next) => {
          if (context.modelActionTypes.includes('moveNodesStart')) {
            await new Promise((resolve) => setTimeout(resolve, 120));
          }
          await next();
        },
      });
    });

    try {
      // One big move past the threshold, then an immediate release.
      const center = await centerOfNode(diagram, 'node-a');
      await diagram.page.mouse.move(center.x, center.y);
      await diagram.page.mouse.down();
      await diagram.page.mouse.move(center.x + 50, center.y, { steps: 1 });
      await diagram.page.mouse.up();

      // Let the suspended pass resume — an unguarded stale continue would apply
      // its 50px move HERE, after the drop.
      await diagram.page.waitForTimeout(300);

      // The gesture genuinely started (guards against a vacuous pass), its
      // lifecycle events paired, and the node never moved.
      expect(await recordedDragEvents(diagram)).toEqual(['started:node-a', 'ended:node-a']);
      expect(await positionOf(diagram, 'node-a')).toEqual(before);
    } finally {
      await diagram.page.evaluate(() =>
        (window as unknown as { __unregisterSlowStart?: () => void }).__unregisterSlowStart?.()
      );
    }

    // The discarded move must not have stranded any gesture state.
    await diagram.dragNode('node-a', { x: 60, y: 30 });
    await expect
      .poll(async () => {
        const after = await positionOf(diagram, 'node-a');
        return Math.abs(after.x - before.x - 60) <= 6 && Math.abs(after.y - before.y - 30) <= 6;
      })
      .toBe(true);
  });

  test('a re-grab while the previous drop is settling gets each gesture its own lifecycle events', async ({
    diagram,
  }) => {
    await diagram.load({ model: pair });
    await recordDragEvents(diagram);

    // Slow ONLY the drag end-phase pass so the first gesture's nodeDragEnded is
    // emitted while the re-grab already owns the live dragging state — an emitter
    // reading that live (still empty) state would swallow the event.
    await diagram.page.evaluate(() => {
      const stash = window as unknown as { __unregisterSlow?: () => void };
      stash.__unregisterSlow = window.__diagram!.diagram.registerMiddleware({
        name: 'e2e-slow-drag-end',
        execute: async (context, next) => {
          if (context.modelActionTypes.includes('moveNodesStop')) {
            await new Promise((resolve) => setTimeout(resolve, 150));
          }
          await next();
        },
      });
    });

    try {
      await diagram.dragNode('node-a', { x: 80, y: 40 });

      // Re-grab immediately but HOLD before moving: the previous drop's
      // suspended pass resumes while the new gesture is still pre-threshold.
      const center = await centerOfNode(diagram, 'node-a');
      await diagram.page.mouse.move(center.x, center.y);
      await diagram.page.mouse.down();
      await diagram.page.waitForTimeout(250);
      await diagram.page.mouse.move(center.x + 60, center.y - 20, { steps: 6 });
      await diagram.page.mouse.up();

      await expect
        .poll(async () => (await recordedDragEvents(diagram)).join(' '))
        .toBe('started:node-a ended:node-a started:node-a ended:node-a');
    } finally {
      await diagram.page.evaluate(() => (window as unknown as { __unregisterSlow?: () => void }).__unregisterSlow?.());
    }
  });

  test('two consecutive links complete and only model edges stay rendered', async ({ diagram }) => {
    // NOTE: this is a SEQUENTIAL pair — the protocol roundtrips between the two
    // gestures (~10-30ms) let the first finishLinking commit before the second
    // starts. The genuinely overlapping case is the next test.
    await diagram.load({ model: trio });
    await expect(diagram.allEdges).toHaveCount(1); // seeded edge-ab

    await diagram.linkPorts({ node: 'node-a', port: 'port-right' }, { node: 'node-c', port: 'port-left' });
    await diagram.linkPorts({ node: 'node-c', port: 'port-right' }, { node: 'node-b', port: 'port-left' });

    await expect.poll(async () => (await diagram.model.edges()).length).toBe(3);
    await expect(diagram.allEdges).toHaveCount(3);
  });

  test('a link attempted while the previous finishLinking pass is suspended is refused, and linking recovers', async ({
    diagram,
  }) => {
    await diagram.load({ model: trio });
    await expect(diagram.allEdges).toHaveCount(1);

    // Slow ONLY the finishLinking pass so the first gesture's cleanup is
    // genuinely still in flight when the second gesture starts.
    await diagram.page.evaluate(() => {
      const stash = window as unknown as { __unregisterSlowLink?: () => void };
      stash.__unregisterSlowLink = window.__diagram!.diagram.registerMiddleware({
        name: 'e2e-slow-finish-linking',
        execute: async (context, next) => {
          if (context.modelActionTypes.includes('finishLinking')) {
            await new Promise((resolve) => setTimeout(resolve, 150));
          }
          await next();
        },
      });
    });

    try {
      await diagram.linkPorts({ node: 'node-a', port: 'port-right' }, { node: 'node-c', port: 'port-left' });
      // Attempt immediately — while finishLinking is suspended, isLinking() is
      // still true and the new gesture is refused BY DESIGN (no edge, no crash).
      await diagram.linkPorts({ node: 'node-c', port: 'port-right' }, { node: 'node-b', port: 'port-left' });

      // First link committed; the overlapping attempt created nothing.
      await expect.poll(async () => (await diagram.model.edges()).length).toBe(2);

      // The guarded regression: a clobbered/stranded linking state would refuse
      // every FUTURE link too. After the suspended cleanup finishes, linking
      // must work again.
      await diagram.page.waitForTimeout(250);
      await diagram.linkPorts({ node: 'node-c', port: 'port-right' }, { node: 'node-b', port: 'port-left' });
      await expect.poll(async () => (await diagram.model.edges()).length).toBe(3);
      await expect(diagram.allEdges).toHaveCount(3);
    } finally {
      await diagram.page.evaluate(() =>
        (window as unknown as { __unregisterSlowLink?: () => void }).__unregisterSlowLink?.()
      );
    }
  });

  test('deleting the node mid-resize clears the gesture state and measurements keep working', async ({ diagram }) => {
    await diagram.load({ model: pair });

    // Select the node to reveal the resize adornment.
    const nodeBox = await diagram.node('node-a').boundingBox();
    if (!nodeBox) throw new Error('node-a has no bounding box');
    await diagram.page.mouse.click(nodeBox.x + nodeBox.width / 2, nodeBox.y + nodeBox.height / 2);

    const handle = diagram.page.locator('[data-node-id="node-a"] ng-diagram-resize-handle.resize-handle--bottom-right');
    await expect(handle).toBeVisible();
    const handleBox = await handle.boundingBox();
    if (!handleBox) throw new Error('resize handle has no bounding box');

    // Start resizing, then press Delete while still holding the button.
    await diagram.page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await diagram.page.mouse.down();
    await diagram.page.mouse.move(handleBox.x + 20, handleBox.y + 20, { steps: 4 });
    await diagram.page.keyboard.press('Delete');
    await diagram.page.mouse.move(handleBox.x + 40, handleBox.y + 40, { steps: 2 });
    await diagram.page.mouse.up();

    await expect(diagram.node('node-a')).toHaveCount(0);

    // The destroyed handle's directive must clear the resize state — a leaked
    // state suppresses every subsequent node size measurement. Note: clearing
    // sets the key to undefined (the key itself stays), so check the value.
    await expect
      .poll(() => diagram.page.evaluate(() => window.__diagram!.diagram.actionState().resize != null))
      .toBe(false);

    await diagram.model.addNodes([
      { id: 'post-delete', position: { x: 520, y: 320 }, data: { label: 'still measured' } },
    ]);
    await expect
      .poll(async () => {
        const node = await diagram.model.getNodeById('post-delete');
        return (node?.size?.width ?? 0) > 0 && (node?.size?.height ?? 0) > 0;
      })
      .toBe(true);
  });

  test('a throwing middleware rejects the awaited call and the diagram keeps working', async ({ diagram }) => {
    await diagram.load({ model: pair });

    const result = await diagram.page.evaluate(async () => {
      const handle = window.__diagram!;
      const unregister = handle.diagram.registerMiddleware({
        name: 'e2e-thrower',
        execute: (context, next) => {
          if (context.initialUpdate.nodesToUpdate?.some((n) => n.id === 'node-a')) {
            throw new Error('e2e middleware failure');
          }
          next();
        },
      });

      let rejectedWith: string | null = null;
      try {
        await handle.model.updateNode('node-a', { data: { label: 'rejected' } });
      } catch (error) {
        rejectedWith = String(error);
      } finally {
        unregister();
      }

      // The update lock must be released — the follow-up update applies normally.
      await handle.model.updateNode('node-a', { data: { label: 'recovered' } });
      const node = handle.model.getNodeById('node-a');
      return { rejectedWith, label: (node?.data as { label?: string })?.label ?? null };
    });

    expect(result.rejectedWith).toContain('e2e middleware failure');
    expect(result.label).toBe('recovered');
  });

  test('a fire-and-forget nested transaction outliving its parent loses no updates', async ({ diagram }) => {
    await diagram.load({ model: pair });

    const warnings: string[] = [];
    diagram.page.on('console', (msg) => {
      if (msg.type() === 'warning') warnings.push(msg.text());
    });

    const result = await diagram.page.evaluate(async () => {
      const handle = window.__diagram!;
      let innerPromise: Promise<unknown> | undefined;

      await handle.diagram.transaction(async () => {
        await handle.model.addNodes([{ id: 'orphan-node', position: { x: 480, y: 200 }, data: { label: 'outer' } }]);
        // Deliberately NOT awaited — the nested transaction outlives its parent.
        innerPromise = handle.diagram.transaction(async () => {
          await new Promise((resolve) => setTimeout(resolve, 40));
          await handle.model.updateNode('orphan-node', { data: { label: 'orphan' } });
        });
      });

      const afterOuter = (handle.model.getNodeById('orphan-node')?.data as { label?: string })?.label ?? null;
      await innerPromise;
      const afterInner = (handle.model.getNodeById('orphan-node')?.data as { label?: string })?.label ?? null;
      return { afterOuter, afterInner };
    });

    // Parent's own update committed while the orphan was still open,
    // and the orphan's update was committed independently afterwards.
    expect(result.afterOuter).toBe('outer');
    expect(result.afterInner).toBe('orphan');
    expect(warnings.some((w) => w.includes('outlived its parent'))).toBe(true);
  });

  test('waitForMeasurements is not hijacked by a concurrent un-awaited update', async ({ diagram }) => {
    await diagram.load({ model: pair });

    const result = await diagram.page.evaluate(async () => {
      const handle = window.__diagram!;
      // Delay ONLY the decoy's pass so it genuinely overlaps the tracked add.
      const unregister = handle.diagram.registerMiddleware({
        name: 'e2e-decoy-delay',
        execute: async (context, next) => {
          if (context.initialUpdate.nodesToUpdate?.some((n) => n.id === 'node-b')) {
            await new Promise((resolve) => setTimeout(resolve, 30));
          }
          await next();
        },
      });

      // The final-size assert alone cannot discriminate a staging hijack: even a
      // decoy-consumed 70ms discovery window usually outlives the real ~50-85ms
      // measurement. Spy WHO gets registered as participants — the registration
      // must belong to the tracked add's pass, not the decoy's.
      const flowCore = handle.diagram['flowCore'];
      const tracker = flowCore.measurementTracker;
      const registrations: string[][] = [];
      const originalRegister = tracker.registerParticipants.bind(tracker);
      tracker.registerParticipants = (ids: string[]) => {
        registrations.push([...ids]);
        return originalRegister(ids);
      };

      try {
        const decoy = handle.model.updateNode('node-b', { position: { x: 420, y: 260 } });
        await handle.model.addNodes(
          [{ id: 'hijack-add', position: { x: 540, y: 260 }, data: { label: 'measured' } }],
          // Widened discovery window (internal escape hatch) so a starved CI
          // renderer cannot expire the legitimate window before the first frame.
          { waitForMeasurements: true, _measurementDiscoveryWindowTimeout: 500 } as { waitForMeasurements: boolean }
        );
        const node = handle.model.getNodeById('hijack-add');
        await decoy.catch(() => undefined);
        return { width: node?.size?.width ?? 0, height: node?.size?.height ?? 0, registrations };
      } finally {
        tracker.registerParticipants = originalRegister;
        unregister();
      }
    });

    // The tracking request must be consumed by the tracked add's own pass:
    // exactly one registration, and it includes the added node. (Middlewares in
    // the same pass may register additional changed entities — that's fine. A
    // hijacked registration would belong to the decoy's pass: node-b without
    // hijack-add.)
    expect(result.registrations).toHaveLength(1);
    expect(result.registrations[0]).toContain('node:hijack-add');
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });
});
