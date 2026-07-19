import { expect, test } from './fixtures/diagram';
import { groupArena, pair, solo, trio } from './fixtures/models';

/**
 * Awaited-contract matrix: every public mutating service method is awaited in
 * the browser and the model is read back SYNCHRONOUSLY (same task, no polling,
 * no extra ticks) — the read must already see the effect. This guards the
 * per-method wiring (a method that stops returning the emit promise resolves
 * instantly and fails these reads under load); the underlying mechanism
 * ("promise settles only after commit") is discriminated separately by the
 * macrotask-middleware tests here and in the unit suite.
 *
 * Each test runs inside a single page.evaluate and returns a list of failure
 * strings — empty means every step held.
 */

test.describe('awaited service API matrix', () => {
  test('NgDiagramModelService: all mutating methods read fresh right after await', async ({ diagram }) => {
    await diagram.load({ model: pair });

    const failures = await diagram.page.evaluate(async () => {
      const handle = window.__diagram!;
      const model = handle.model;
      const fails: string[] = [];
      const check = (cond: boolean, msg: string) => {
        if (!cond) fails.push(msg);
      };

      await model.addNodes([{ id: 'm-add', position: { x: 500, y: 100 }, data: { label: 'added' } }]);
      check(!!model.getNodeById('m-add'), 'addNodes: node missing right after await');

      await model.updateNode('m-add', { position: { x: 520, y: 120 } });
      check(model.getNodeById('m-add')?.position.x === 520, 'updateNode: position stale right after await');

      await model.updateNodeData('m-add', { label: 'renamed' });
      check(
        (model.getNodeById('m-add')?.data as { label?: string })?.label === 'renamed',
        'updateNodeData: data stale right after await'
      );

      await model.updateNodes([
        { id: 'm-add', position: { x: 540, y: 140 } },
        { id: 'node-a', position: { x: 90, y: 130 } },
      ]);
      check(
        model.getNodeById('m-add')?.position.x === 540 && model.getNodeById('node-a')?.position.x === 90,
        'updateNodes: bulk update stale right after await'
      );

      await model.addEdges([{ id: 'm-edge', source: 'node-a', target: 'node-b', data: {} }]);
      check(!!model.getEdgeById('m-edge'), 'addEdges: edge missing right after await');

      await model.updateEdge('m-edge', { data: { note: 'x' } });
      check(
        (model.getEdgeById('m-edge')?.data as { note?: string })?.note === 'x',
        'updateEdge: data stale right after await'
      );

      await model.updateEdgeData('m-edge', { note: 'y' });
      check(
        (model.getEdgeById('m-edge')?.data as { note?: string })?.note === 'y',
        'updateEdgeData: data stale right after await'
      );

      await model.updateEdges([{ id: 'm-edge', data: { note: 'z' } }]);
      check(
        (model.getEdgeById('m-edge')?.data as { note?: string })?.note === 'z',
        'updateEdges: bulk update stale right after await'
      );

      await model.deleteEdges(['m-edge']);
      check(model.getEdgeById('m-edge') === null, 'deleteEdges: edge still present right after await');

      await model.deleteNodes(['m-add']);
      check(model.getNodeById('m-add') === null, 'deleteNodes: node still present right after await');

      // Tight delete → re-add of the same id: only works because each awaited
      // step committed (inside one transaction adds apply before removes).
      await model.addNodes([{ id: 'm-readd', position: { x: 500, y: 180 }, data: { label: 'v1' } }]);
      await model.deleteNodes(['m-readd']);
      check(model.getNodeById('m-readd') === null, 'delete→re-add: node not gone between awaited steps');
      await model.addNodes([{ id: 'm-readd', position: { x: 500, y: 180 }, data: { label: 'v2' } }]);
      check(
        (model.getNodeById('m-readd')?.data as { label?: string })?.label === 'v2',
        'delete→re-add: re-added node missing or stale right after await'
      );

      return fails;
    });

    expect(failures).toEqual([]);
  });

  test('NgDiagramNodeService: all mutating methods read fresh right after await', async ({ diagram }) => {
    await diagram.load({ model: pair });

    const failures = await diagram.page.evaluate(async () => {
      const handle = window.__diagram!;
      const { nodes, model } = handle;
      const fails: string[] = [];
      const check = (cond: boolean, msg: string) => {
        if (!cond) fails.push(msg);
      };

      const before = model.getNodeById('node-a')!.position;
      await nodes.moveNodesBy([model.getNodeById('node-a')!], { x: 30, y: 10 });
      const moved = model.getNodeById('node-a')!.position;
      check(
        moved.x === before.x + 30 && moved.y === before.y + 10,
        `moveNodesBy: position stale right after await (got ${JSON.stringify(moved)})`
      );

      await nodes.rotateNodeTo('node-a', 45);
      check(model.getNodeById('node-a')?.angle === 45, 'rotateNodeTo: angle stale right after await');

      await nodes.resizeNode('node-a', { width: 240, height: 90 }, undefined, true);
      const size = model.getNodeById('node-a')?.size;
      check(
        size?.width === 240 && size?.height === 90,
        `resizeNode: size stale right after await (got ${JSON.stringify(size)})`
      );

      await nodes.bringToFront(['node-a']);
      const frontZ = model.getNodeById('node-a')?.zOrder;
      check(typeof frontZ === 'number', 'bringToFront: zOrder not applied right after await');

      await nodes.sendToBack(['node-a']);
      const backZ = model.getNodeById('node-a')?.zOrder;
      check(
        typeof backZ === 'number' && (frontZ as number) > backZ,
        `sendToBack: zOrder not lowered right after await (front ${frontZ}, back ${backZ})`
      );

      return fails;
    });

    expect(failures).toEqual([]);
  });

  test('NgDiagramSelectionService: all methods read fresh right after await', async ({ diagram }) => {
    await diagram.load({ model: trio });

    const failures = await diagram.page.evaluate(async () => {
      const handle = window.__diagram!;
      const { selection, model } = handle;
      const fails: string[] = [];
      const check = (cond: boolean, msg: string) => {
        if (!cond) fails.push(msg);
      };

      await selection.select(['node-a', 'node-b']);
      check(
        model.getNodeById('node-a')?.selected === true && model.getNodeById('node-b')?.selected === true,
        'select: selected flags stale right after await'
      );

      await selection.deselect(['node-b']);
      check(
        model.getNodeById('node-a')?.selected === true && model.getNodeById('node-b')?.selected !== true,
        'deselect: selected flag stale right after await'
      );

      await selection.deselectAll();
      check(
        model
          .getModel()
          .getNodes()
          .every((n) => n.selected !== true),
        'deselectAll: some nodes still selected right after await'
      );

      await selection.select(['node-c']);
      await selection.deleteSelection();
      check(model.getNodeById('node-c') === null, 'deleteSelection: selected node still present right after await');

      return fails;
    });

    expect(failures).toEqual([]);
  });

  test('NgDiagramGroupsService: all methods read fresh right after await (incl. nested highlight-clear)', async ({
    diagram,
  }) => {
    await diagram.load({ model: groupArena });

    const failures = await diagram.page.evaluate(async () => {
      const handle = window.__diagram!;
      const { groups, model } = handle;
      const fails: string[] = [];
      const check = (cond: boolean, msg: string) => {
        if (!cond) fails.push(msg);
      };
      const groupHighlighted = () =>
        (model.getNodeById('grp-1') as { highlighted?: boolean } | null)?.highlighted === true;

      const free = model.getNodeById('free-1')!;
      await groups.highlightGroup('grp-1', [free]);
      check(groupHighlighted(), 'highlightGroup: highlighted flag stale right after await');

      await groups.highlightGroupClear();
      check(!groupHighlighted(), 'highlightGroupClear: highlighted flag stale right after await');

      await groups.highlightGroup('grp-1', [free]);
      await groups.addToGroup('grp-1', ['free-1']);
      check(model.getNodeById('free-1')?.groupId === 'grp-1', 'addToGroup: groupId stale right after await');
      // addToGroup awaits its nested highlightGroupClear emit — the highlight
      // must ALREADY be gone when the promise resolves.
      check(!groupHighlighted(), 'addToGroup: nested highlightGroupClear not awaited (group still highlighted)');

      await groups.removeFromGroup('grp-1', ['free-1']);
      check(model.getNodeById('free-1')?.groupId === undefined, 'removeFromGroup: groupId stale right after await');

      return fails;
    });

    expect(failures).toEqual([]);
  });

  test('NgDiagramClipboardService: copy, cut, paste read fresh right after await', async ({ diagram }) => {
    await diagram.load({ model: pair });

    const failures = await diagram.page.evaluate(async () => {
      const handle = window.__diagram!;
      const { clipboard, selection, model } = handle;
      const fails: string[] = [];
      const check = (cond: boolean, msg: string) => {
        if (!cond) fails.push(msg);
      };
      const nodeCount = () => model.getModel().getNodes().length;

      await selection.select(['node-a']);
      await clipboard.copy();
      const beforePaste = nodeCount();
      await clipboard.paste({ x: 600, y: 300 });
      check(nodeCount() === beforePaste + 1, 'paste (after copy): node count stale right after await');

      await selection.select(['node-b']);
      const beforeCut = nodeCount();
      await clipboard.cut();
      check(nodeCount() === beforeCut - 1, 'cut: node count stale right after await');
      check(model.getNodeById('node-b') === null, 'cut: cut node still present right after await');

      const beforePaste2 = nodeCount();
      await clipboard.paste({ x: 640, y: 340 });
      check(nodeCount() === beforePaste2 + 1, 'paste (after cut): node count stale right after await');

      return fails;
    });

    expect(failures).toEqual([]);
  });

  test('NgDiagramViewportService: all mutating methods read fresh right after await', async ({ diagram }) => {
    await diagram.load({ model: pair });

    const failures = await diagram.page.evaluate(async () => {
      const handle = window.__diagram!;
      const { viewport, model } = handle;
      const fails: string[] = [];
      const check = (cond: boolean, msg: string) => {
        if (!cond) fails.push(msg);
      };
      const vp = () => model.getModel().getMetadata().viewport;

      await viewport.setViewport(100, 50, 1);
      check(
        vp().x === 100 && vp().y === 50 && vp().scale === 1,
        `setViewport: viewport stale right after await (got ${JSON.stringify(vp())})`
      );

      await viewport.moveViewport(20, 30);
      check(vp().x === 20 && vp().y === 30, 'moveViewport: viewport stale right after await');

      await viewport.moveViewportBy(5, -10);
      check(vp().x === 25 && vp().y === 20, 'moveViewportBy: viewport stale right after await');

      await viewport.zoom(1.2);
      check(Math.abs(vp().scale - 1.2) < 0.001, `zoom: scale stale right after await (got ${vp().scale})`);

      const beforeFit = { ...vp() };
      await viewport.zoomToFit();
      check(
        vp().x !== beforeFit.x || vp().y !== beforeFit.y || vp().scale !== beforeFit.scale,
        'zoomToFit: viewport unchanged right after await'
      );

      const beforeCenter = { ...vp() };
      await viewport.centerOnNode('node-a');
      check(
        vp().x !== beforeCenter.x || vp().y !== beforeCenter.y,
        'centerOnNode: viewport unchanged right after await'
      );

      const beforeRect = { ...vp() };
      await viewport.centerOnRect({ x: 900, y: 900, width: 200, height: 100 });
      check(vp().x !== beforeRect.x || vp().y !== beforeRect.y, 'centerOnRect: viewport unchanged right after await');

      return fails;
    });

    expect(failures).toEqual([]);
  });

  test('NgDiagramService.transaction: every overload returns an awaitable commit promise (cross-realm)', async ({
    diagram,
  }) => {
    await diagram.load({ model: pair });

    const warnings: string[] = [];
    diagram.page.on('console', (msg) => {
      if (msg.type() === 'warning') warnings.push(msg.text());
    });

    const failures = await diagram.page.evaluate(async () => {
      const handle = window.__diagram!;
      const { diagram: svc, model } = handle;
      const fails: string[] = [];
      const check = (cond: boolean, msg: string) => {
        if (!cond) fails.push(msg);
      };

      // Sync-callback overload — regression guard for the realm-sensitive
      // `instanceof Promise` detection: callbacks created in this (evaluate)
      // realm are NOT instances of the page's Zone-patched Promise.
      const syncResult = svc.transaction(() => {
        void model.addNodes([{ id: 'tx-sync', position: { x: 700, y: 100 }, data: { label: 'sync' } }]);
      });
      check(
        !!syncResult && typeof (syncResult as Promise<unknown>).then === 'function',
        'transaction(sync cb): did not return a promise'
      );
      await syncResult;
      check(!!model.getNodeById('tx-sync'), 'transaction(sync cb): node missing right after await');

      // Async-callback overload: queued mid-callback, committed on resolve.
      let inModelDuringCallback: boolean | null = null;
      await svc.transaction(async () => {
        await model.addNodes([{ id: 'tx-async', position: { x: 700, y: 160 }, data: { label: 'async' } }]);
        inModelDuringCallback = model.getNodeById('tx-async') !== null;
      });
      check(inModelDuringCallback === false, 'transaction(async cb): change visible mid-callback (should be queued)');
      check(!!model.getNodeById('tx-async'), 'transaction(async cb): node missing right after await');

      // Rollback: a throwing callback rejects and nothing reaches the model.
      let rejected = false;
      try {
        await svc.transaction(async () => {
          await model.addNodes([{ id: 'tx-rollback', position: { x: 700, y: 220 }, data: { label: 'x' } }]);
          throw new Error('rollback');
        });
      } catch {
        rejected = true;
      }
      check(rejected, 'transaction rollback: awaited transaction did not reject');
      check(model.getNodeById('tx-rollback') === null, 'transaction rollback: node reached the model');

      // waitForMeasurements inside a transaction: ignored with a warn, still committed.
      await svc.transaction(async () => {
        await model.addNodes([{ id: 'tx-wfm', position: { x: 700, y: 280 }, data: { label: 'wfm' } }], {
          waitForMeasurements: true,
        });
      });
      check(!!model.getNodeById('tx-wfm'), 'wfm inside transaction: node missing right after await');

      // Options-bearing overloads: sync callback + options...
      await svc.transaction(
        () => {
          void model.addNodes([{ id: 'tx-sync-opts', position: { x: 700, y: 340 }, data: { label: 'so' } }]);
        },
        { waitForMeasurements: true, _measurementDiscoveryWindowTimeout: 500 } as { waitForMeasurements: boolean }
      );
      check(!!model.getNodeById('tx-sync-opts'), 'transaction(sync cb, options): node missing right after await');
      const syncOptsSize = model.getNodeById('tx-sync-opts')?.size;
      check(
        (syncOptsSize?.width ?? 0) > 0,
        'transaction(sync cb, options): waitForMeasurements did not measure the node before resolve'
      );

      // ...and async callback + options.
      await svc.transaction(
        async () => {
          await model.addNodes([{ id: 'tx-async-opts', position: { x: 700, y: 400 }, data: { label: 'ao' } }]);
        },
        { waitForMeasurements: true, _measurementDiscoveryWindowTimeout: 500 } as { waitForMeasurements: boolean }
      );
      check(!!model.getNodeById('tx-async-opts'), 'transaction(async cb, options): node missing right after await');
      const asyncOptsSize = model.getNodeById('tx-async-opts')?.size;
      check(
        (asyncOptsSize?.width ?? 0) > 0,
        'transaction(async cb, options): waitForMeasurements did not measure the node before resolve'
      );

      return fails;
    });

    expect(failures).toEqual([]);
    expect(warnings.some((w) => w.includes('waitForMeasurements is ignored inside a transaction'))).toBe(true);
  });

  test('awaits span a macrotask-async middleware and still read fresh', async ({ diagram }) => {
    await diagram.load({ model: pair });

    const result = await diagram.page.evaluate(async () => {
      const handle = window.__diagram!;
      const unregister = handle.diagram.registerMiddleware({
        name: 'e2e-macrotask-delay',
        execute: async (_context, next) => {
          await new Promise((resolve) => setTimeout(resolve, 20));
          await next();
        },
      });
      try {
        const t1 = performance.now();
        await handle.model.updateNode('node-a', { position: { x: 111, y: 222 } });
        const elapsed = performance.now() - t1;
        const position = handle.model.getNodeById('node-a')?.position;
        return { elapsed, position };
      } finally {
        unregister();
      }
    });

    // Early resolution (dropped command promise) would give elapsed < 20ms and a stale read.
    expect(result.elapsed).toBeGreaterThanOrEqual(20);
    expect(result.position).toEqual({ x: 111, y: 222 });
  });

  test('waitForMeasurements variants resolve with the effect applied (full method matrix)', async ({ diagram }) => {
    await diagram.load({ model: solo });

    const failures = await diagram.page.evaluate(async () => {
      const handle = window.__diagram!;
      const model = handle.model;
      const fails: string[] = [];
      const check = (cond: boolean, msg: string) => {
        if (!cond) fails.push(msg);
      };
      // A hang here would time out the whole test — each await below must
      // resolve via measurement settlement or the discovery-window timeout.

      await model.addNodes(
        [{ id: 'w-node', position: { x: 400, y: 100 }, data: { label: 'w' } }],
        // Widened discovery window (internal escape hatch): on a starved CI
        // renderer the production 70ms window can expire before the first
        // frame delivers the measurement, turning this into a false red.
        { waitForMeasurements: true, _measurementDiscoveryWindowTimeout: 500 } as { waitForMeasurements: boolean }
      );
      const size = model.getNodeById('w-node')?.size;
      check((size?.width ?? 0) > 0 && (size?.height ?? 0) > 0, 'addNodes+wfm: node not measured on resolve');

      await model.updateNode('w-node', { position: { x: 420, y: 120 } }, { waitForMeasurements: true });
      check(model.getNodeById('w-node')?.position.x === 420, 'updateNode+wfm: position stale on resolve');

      await model.updateNodes([{ id: 'w-node', position: { x: 440, y: 140 } }], { waitForMeasurements: true });
      check(model.getNodeById('w-node')?.position.x === 440, 'updateNodes+wfm: position stale on resolve');

      await model.addNodes([{ id: 'w-node2', position: { x: 400, y: 220 }, data: { label: 'w2' } }]);
      await model.addEdges([{ id: 'w-edge', source: 'w-node', target: 'w-node2', data: {} }], {
        waitForMeasurements: true,
      });
      check(!!model.getEdgeById('w-edge'), 'addEdges+wfm: edge missing on resolve');

      await model.updateEdge('w-edge', { data: { note: 'a' } }, { waitForMeasurements: true });
      check(
        (model.getEdgeById('w-edge')?.data as { note?: string })?.note === 'a',
        'updateEdge+wfm: data stale on resolve'
      );

      await model.updateEdges([{ id: 'w-edge', data: { note: 'b' } }], { waitForMeasurements: true });
      check(
        (model.getEdgeById('w-edge')?.data as { note?: string })?.note === 'b',
        'updateEdges+wfm: data stale on resolve'
      );

      await handle.nodes.resizeNode('w-node', { width: 260, height: 80 }, undefined, true, {
        waitForMeasurements: true,
      });
      const resized = model.getNodeById('w-node')?.size;
      check(
        resized?.width === 260 && resized?.height === 80,
        `resizeNode+wfm: size stale on resolve (got ${JSON.stringify(resized)})`
      );

      return fails;
    });

    expect(failures).toEqual([]);
  });
});
