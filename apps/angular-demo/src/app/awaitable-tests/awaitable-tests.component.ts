import { Component, inject, OnDestroy, output, signal } from '@angular/core';
import {
  Middleware,
  NgDiagramGroupsService,
  NgDiagramModelService,
  NgDiagramService,
  NgDiagramViewportService,
  type Edge,
  type GroupNode,
  type Node,
  type Point,
} from 'ng-diagram';

interface TestResult {
  name: string;
  passed: boolean;
  elapsed: number;
  details: string;
  failures: string[];
}

/**
 * Every mutation in this suite would previously hang or read stale state —
 * a scenario that does not settle within this budget is reported as FAIL
 * ("possible frozen update lock"), never left hanging.
 */
const SETTLE_TIMEOUT_MS = 5000;

/**
 * Pause between VISUAL steps (e.g. after adding a node that is about to be
 * deleted) so a human can see the intermediate state on the canvas.
 * NEVER placed between an awaited mutation and its assertion — that would
 * mask stale reads and invalidate the test.
 */
const VISUAL_PAUSE_MS = 500;

/** Vertical distance between consecutive test nodes in the column. */
const ROW_HEIGHT = 90;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface SettleOutcome {
  status: 'resolved' | 'rejected' | 'timeout';
  error?: unknown;
}

/**
 * Awaitable-mutations test mode.
 *
 * Verifies the Phase 1 guarantees end-to-end in the real app:
 * a promise returned by a mutating service method resolves only after the
 * middleware chain ran and the change was committed to the model — so code
 * that previously needed polling / manual waiting can read synchronously
 * right after the await.
 *
 * All test nodes are stacked in a single column placed in the CURRENTLY
 * VISIBLE part of the canvas (computed from the viewport on first use), so
 * every scenario's effect is observable without panning.
 *
 * IMPORTANT for reviewers: every assertion reads the model SYNCHRONOUSLY
 * after the await (via getModel().getNodes()), with no extra ticks in
 * between. The visual pauses sit only BETWEEN scenario steps. Signals are
 * intentionally NOT asserted (they refresh asynchronously — Phase 2);
 * scenario 1 reports their state as info only.
 */
@Component({
  selector: 'app-awaitable-tests',
  templateUrl: './awaitable-tests.component.html',
  styleUrl: './awaitable-tests.component.scss',
})
export class AwaitableTestsComponent implements OnDestroy {
  private readonly ngDiagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly groupsService = inject(NgDiagramGroupsService);

  exit = output<void>();

  results = signal<TestResult[]>([]);
  isRunning = signal(false);
  summary = signal<string | null>(null);

  virtualizationEnabled = this.ngDiagramService.config().virtualization?.enabled === true;

  private idCounter = Date.now() % 100000;

  constructor() {
    // Hook for scripted runs (console / Playwright):
    //   await window.__awaitableTests.runAll() -> { passed, failed, results }
    (window as unknown as Record<string, unknown>)['__awaitableTests'] = {
      runAll: async () => {
        await this.runAll();
        const results = this.results();
        return {
          passed: results.filter((r) => r.passed).length,
          failed: results.filter((r) => !r.passed).length,
          results,
        };
      },
    };
  }

  ngOnDestroy(): void {
    delete (window as unknown as Record<string, unknown>)['__awaitableTests'];
  }

  async runAll() {
    this.results.set([]);
    this.summary.set(null);
    this.isRunning.set(true);

    await this.testFreshAfterAdd();
    await this.testFreshAfterUpdate();
    await this.testFreshAfterDelete();
    await this.testDeleteThenReadd();
    await this.testFreshWithAsyncMiddleware();
    await this.testWaitForMeasurementsAdd();
    await this.testWaitForMeasurementsDataOnly();
    await this.testTransactionCommit();
    await this.testTransactionRollback();
    await this.testWaitForMeasurementsInsideTransaction();
    await this.testOrphanNestedTransaction();
    await this.testThrowingMiddleware();
    await this.testNestedEmitAwaited();
    await this.testTrackingNotHijacked();

    const results = this.results();
    const passed = results.filter((r) => r.passed).length;
    this.summary.set(`${passed}/${results.length} passed`);
    this.isRunning.set(false);
  }

  // =============================================
  // 1. Model reads fresh synchronously after await (add)
  // =============================================

  async testFreshAfterAdd() {
    const id = this.nextId('add');
    const t1 = performance.now();

    await this.modelService.addNodes([this.makeNode(id, 'S1: added → read instantly')]);
    // Synchronous reads — no ticks between the await and these lines.
    const node = this.getNode(id);
    const signalHasNode = this.modelService.nodes().some((n) => n.id === id);

    this.addResult(
      'S1 · Model fresh after awaited addNodes',
      performance.now() - t1,
      (assert) => {
        assert(!!node, `getNodes() must contain '${id}' synchronously after the await`);
      },
      `info: signal nodes() ${signalHasNode ? 'already contains' : 'does NOT yet contain'} the node (signals refresh async — Phase 2)`
    );
  }

  // =============================================
  // 2. Model reads fresh synchronously after await (update)
  // =============================================

  async testFreshAfterUpdate() {
    const id = this.nextId('upd');
    const created = this.makeNode(id, 'S2: will jump right on update');
    await this.modelService.addNodes([created]);
    await sleep(VISUAL_PAUSE_MS); // let the "before" state be seen

    const target = { x: created.position.x + 120, y: created.position.y };
    const t1 = performance.now();
    await this.modelService.updateNode(id, { position: target, data: { label: 'S2: updated → read instantly' } });
    const node = this.getNode(id);

    this.addResult('S2 · Model fresh after awaited updateNode', performance.now() - t1, (assert) => {
      assert(
        node?.position.x === target.x && node?.position.y === target.y,
        `position must read ${JSON.stringify(target)} synchronously, got ${JSON.stringify(node?.position)}`
      );
    });
  }

  // =============================================
  // 3. Model fresh after await (delete)
  // =============================================

  async testFreshAfterDelete() {
    const id = this.nextId('del');
    await this.modelService.addNodes([this.makeNode(id, 'S3: will be DELETED in 0.5s')]);
    await sleep(VISUAL_PAUSE_MS); // let the node be seen before it disappears

    const t1 = performance.now();
    await this.modelService.deleteNodes([id]);
    const node = this.getNode(id);

    this.addResult('S3 · Model fresh after awaited deleteNodes', performance.now() - t1, (assert) => {
      assert(node === undefined, `node '${id}' must be gone synchronously after the await`);
    });
  }

  // =============================================
  // 4. Sequential awaited ops on the same id (needs committed state between steps).
  // Inside ONE transaction this exact sequence would fail (commit applies adds
  // before removes) — awaited sequence outside a transaction must work.
  // =============================================

  async testDeleteThenReadd() {
    const id = this.nextId('readd');
    const created = this.makeNode(id, 'S4: original — delete, then re-add');
    // DELIBERATELY NO PAUSES anywhere in this scenario: the whole point is that
    // the tight chain add → delete → re-add works because each awaited step
    // committed — not because time passed. A pause inside the chain would make
    // this pass even on an early-resolving (broken) implementation.
    // S3 is the visually observable deletion demo instead.
    const t1 = performance.now();
    await this.modelService.addNodes([created]);
    await this.modelService.deleteNodes([id]);
    const goneBetweenSteps = this.getNode(id) === undefined;
    await this.modelService.addNodes([{ ...created, data: { label: 'S4: re-added under the same id' } }]);
    const node = this.getNode(id);

    this.addResult('S4 · Sequential delete → re-add of the same id', performance.now() - t1, (assert) => {
      assert(goneBetweenSteps, `node must be absent between the two awaited steps`);
      assert(
        (node?.data as { label?: string })?.label === 'S4: re-added under the same id',
        `node must exist with new data after re-add, got label '${(node?.data as { label?: string })?.label}'`
      );
    });
  }

  // =============================================
  // 5. THE discriminating Phase-1 scenario: with a MACROTASK-async middleware
  // in the chain, the old implementation resolved the await ~1 microtask in
  // (long before setState) — this test read stale state 100% of the time.
  // =============================================

  async testFreshWithAsyncMiddleware() {
    const id = this.nextId('mw');
    const created = this.makeNode(id, 'S5: slow middleware — will jump right');
    await this.modelService.addNodes([created]);
    await sleep(VISUAL_PAUSE_MS);

    const delayingMiddleware: Middleware = {
      name: 'awaitable-test-macrotask-delay',
      execute: async (_context, next) => {
        // Macrotask, not microtask — a microtask delay could be absorbed by
        // the old early-resolving emit and mask the regression.
        await sleep(20);
        await next();
      },
    };
    const unregister = this.ngDiagramService.registerMiddleware(delayingMiddleware);
    const target = { x: created.position.x + 120, y: created.position.y };
    const t1 = performance.now();

    try {
      const outcome = await this.settleWithin(this.modelService.updateNode(id, { position: target }));
      const node = this.getNode(id);
      const elapsed = performance.now() - t1;

      this.addResult('S5 · Model fresh despite macrotask-async middleware', elapsed, (assert) => {
        assert(outcome.status === 'resolved', this.settleFailure('updateNode', outcome));
        assert(
          elapsed >= 20,
          `await must span the middleware delay (>=20ms), resolved after ${elapsed.toFixed(0)}ms — early resolution means the command promise was dropped`
        );
        assert(
          node?.position.x === target.x,
          `position must read {x: ${target.x}} synchronously after the await, got ${JSON.stringify(node?.position)}`
        );
      });
    } finally {
      unregister();
    }
  }

  // =============================================
  // 6. waitForMeasurements on addNodes — size measured when the promise resolves
  // =============================================

  async testWaitForMeasurementsAdd() {
    const id = this.nextId('wfm-add');
    const t1 = performance.now();

    const outcome = await this.settleWithin(
      this.modelService.addNodes([this.makeNode(id, 'S6: measured before resolve')], { waitForMeasurements: true })
    );
    const node = this.getNode(id);

    this.addResult('S6 · waitForMeasurements: node measured on resolve', performance.now() - t1, (assert) => {
      assert(outcome.status === 'resolved', this.settleFailure('addNodes(waitForMeasurements)', outcome));
      assert(
        (node?.size?.width ?? 0) > 0 && (node?.size?.height ?? 0) > 0,
        `node.size must be measured (>0) when the promise resolves, got ${node?.size?.width}x${node?.size?.height}`
      );
    });
  }

  // =============================================
  // 7. waitForMeasurements on an update that measures NOTHING — must resolve,
  // not hang. The updated data field is deliberately NOT rendered by any
  // template, so no DOM change and no ResizeObserver activity can occur —
  // the promise resolves purely via the tracker's discovery-window timeout.
  // (A rendered field like `label` could trigger a real measurement and
  // silently weaken this into a "resolves after measurement" test.)
  // =============================================

  async testWaitForMeasurementsDataOnly() {
    const id = this.nextId('wfm-data');
    const label = 'S7: invisible field updated (see results)';
    await this.modelService.addNodes([this.makeNode(id, label)]);
    await sleep(VISUAL_PAUSE_MS); // let the add's own measurement settle first

    const t1 = performance.now();
    const outcome = await this.settleWithin(
      this.modelService.updateNode(id, { data: { label, hiddenMarker: 'updated' } }, { waitForMeasurements: true })
    );
    const node = this.getNode(id);

    this.addResult('S7 · waitForMeasurements: no-measure update resolves', performance.now() - t1, (assert) => {
      assert(outcome.status === 'resolved', this.settleFailure('updateNode(waitForMeasurements)', outcome));
      assert(
        (node?.data as { hiddenMarker?: string })?.hiddenMarker === 'updated',
        `data must be applied on resolve, got hiddenMarker '${(node?.data as { hiddenMarker?: string })?.hiddenMarker}'`
      );
    });
  }

  // =============================================
  // 8. Awaited transaction: interior awaited + single commit on resolve
  // =============================================

  async testTransactionCommit() {
    const n1 = this.nextId('tx-n1');
    const n2 = this.nextId('tx-n2');
    const e1 = this.nextId('tx-e');
    const t1 = performance.now();

    let inModelDuringCallback: boolean | null = null;

    const source = this.makeNode(n1, 'S8: tx source');
    const target = this.makeNode(n2, 'S8: tx target', { x: source.position.x + 320, y: source.position.y });

    await this.ngDiagramService.transaction(async () => {
      await this.modelService.addNodes([source, target]);
      // Queued, not committed — the model must NOT contain the node yet.
      inModelDuringCallback = this.getNode(n1) !== undefined;
      await this.modelService.addEdges([
        { id: e1, source: n1, target: n2, sourcePort: 'port-right', targetPort: 'port-left', data: {} },
      ]);
    });

    const node1 = this.getNode(n1);
    const edge = this.getEdge(e1);

    this.addResult('S8 · Awaited transaction commits everything on resolve', performance.now() - t1, (assert) => {
      assert(
        inModelDuringCallback === false,
        `inside the callback the change is only QUEUED — model must not contain it yet`
      );
      assert(!!node1, `node must be in the model synchronously after the transaction resolves`);
      assert(edge?.source === n1 && edge?.target === n2, `edge must be committed and connect the two nodes`);
    });
  }

  // =============================================
  // 9. Transaction rollback: a throw inside discards everything
  // =============================================

  async testTransactionRollback() {
    const id = this.nextId('rollback');
    const t1 = performance.now();
    let rejected = false;

    try {
      await this.ngDiagramService.transaction(async () => {
        await this.modelService.addNodes([this.makeNode(id, 'S9: must never appear (rollback)')]);
        throw new Error('intentional rollback');
      });
    } catch {
      rejected = true;
    }
    const node = this.getNode(id);
    this.releaseRow(); // the row was reserved but the node never materialized

    this.addResult('S9 · Transaction rollback on error', performance.now() - t1, (assert) => {
      assert(rejected, `the awaited transaction must reject with the callback error`);
      assert(node === undefined, `the queued node must NOT reach the model after rollback`);
    });
  }

  // =============================================
  // 10. waitForMeasurements INSIDE a transaction is ignored with a console.warn
  // (an inner nested transaction there used to corrupt the transaction stack)
  // =============================================

  async testWaitForMeasurementsInsideTransaction() {
    const id = this.nextId('wfm-in-tx');
    const t1 = performance.now();
    const warnings = this.captureWarnings();

    try {
      await this.ngDiagramService.transaction(async () => {
        await this.modelService.addNodes([this.makeNode(id, 'S10: wfm inside tx (warn expected)')], {
          waitForMeasurements: true,
        });
      });
    } finally {
      warnings.restore();
    }
    const node = this.getNode(id);

    this.addResult(
      'S10 · waitForMeasurements inside a transaction: warn + applied at commit',
      performance.now() - t1,
      (assert) => {
        assert(
          warnings.messages.some((m) => m.includes('waitForMeasurements is ignored inside a transaction')),
          `expected the "ignored inside a transaction" console.warn, got: [${warnings.messages.join(' | ')}]`
        );
        assert(!!node, `the node must still be committed with the transaction`);
      }
    );
  }

  // =============================================
  // 11. Fire-and-forget nested transaction outliving its parent — updates from
  // BOTH transactions must survive (this used to silently drop everything by
  // corrupting the transaction stack) and a warning must be logged.
  // =============================================

  async testOrphanNestedTransaction() {
    const outerId = this.nextId('orphan-outer');
    const t1 = performance.now();
    const warnings = this.captureWarnings();
    let innerPromise: Promise<unknown> | undefined;

    try {
      await this.ngDiagramService.transaction(async () => {
        await this.modelService.addNodes([this.makeNode(outerId, 'S11: outer tx committed')]);
        // Deliberately NOT awaited — the nested transaction outlives its parent.
        innerPromise = this.ngDiagramService.transaction(async () => {
          await sleep(40);
          await this.modelService.updateNode(outerId, { data: { label: 'S11: orphan tx applied too' } });
        });
      });

      // The parent committed — its own update must be in the model already,
      // even though the orphaned nested transaction is still open.
      const nodeAfterOuter = this.getNode(outerId);
      const outerCommitted = (nodeAfterOuter?.data as { label?: string })?.label === 'S11: outer tx committed';

      const outcome = await this.settleWithin(innerPromise!);
      const nodeAfterInner = this.getNode(outerId);

      this.addResult('S11 · Orphaned nested transaction loses no updates', performance.now() - t1, (assert) => {
        assert(outerCommitted, `parent transaction's own update must be committed right after it resolves`);
        assert(outcome.status === 'resolved', this.settleFailure('orphaned nested transaction', outcome));
        assert(
          (nodeAfterInner?.data as { label?: string })?.label === 'S11: orphan tx applied too',
          `the orphaned transaction's update must be committed independently, got label '${(nodeAfterInner?.data as { label?: string })?.label}'`
        );
        assert(
          warnings.messages.some((m) => m.includes('outlived its parent')),
          `expected the "outlived its parent" console.warn, got: [${warnings.messages.join(' | ')}]`
        );
      });
    } finally {
      warnings.restore();
    }
  }

  // =============================================
  // 12. A throwing middleware rejects the awaited call — and the diagram
  // keeps working afterwards (this used to freeze every subsequent update
  // by leaving the update lock held forever).
  // =============================================

  async testThrowingMiddleware() {
    const id = this.nextId('throw');
    await this.modelService.addNodes([this.makeNode(id, 'S12: middleware will reject my update')]);
    await sleep(VISUAL_PAUSE_MS);

    const throwingMiddleware: Middleware = {
      name: 'awaitable-test-thrower',
      execute: (context, next) => {
        if (context.initialUpdate.nodesToUpdate?.some((n) => n.id === id)) {
          throw new Error('middleware validation failed');
        }
        next();
      },
    };
    const unregister = this.ngDiagramService.registerMiddleware(throwingMiddleware);
    const errors = this.captureErrors();
    const t1 = performance.now();

    let firstOutcome: SettleOutcome = { status: 'timeout' };

    try {
      firstOutcome = await this.settleWithin(this.modelService.updateNode(id, { data: { label: 'rejected' } }));
    } finally {
      unregister();
    }

    // Diagram must survive: the next update (middleware gone) must apply normally.
    const secondOutcome = await this.settleWithin(
      this.modelService.updateNode(id, { data: { label: 'S12: rejected once, then recovered' } })
    );
    const nodeAfterRecovery = this.getNode(id);

    // Give async error reporting (Zone/ErrorHandler) time to drain, then stop
    // capturing. This sleep is NOT between an awaited mutation and its state
    // assertion — the reads above already happened synchronously.
    await sleep(150);
    errors.restore();
    const leakedErrors = errors.messages.filter((m) => m.includes('middleware validation failed'));

    this.addResult('S12 · Throwing middleware rejects the call, diagram survives', performance.now() - t1, (assert) => {
      assert(
        leakedErrors.length === 0,
        `the caught rejection must not leak to console.error (unhandled rejection reports), got ${leakedErrors.length} entries`
      );
      assert(
        firstOutcome.status === 'rejected',
        firstOutcome.status === 'timeout'
          ? `update did not settle within ${SETTLE_TIMEOUT_MS}ms — the update lock is likely frozen (pre-fix behavior)`
          : `the awaited update must REJECT with the middleware error, but it ${firstOutcome.status}`
      );
      assert(
        String(firstOutcome.error).includes('middleware validation failed'),
        `rejection must carry the middleware error, got: ${String(firstOutcome.error)}`
      );
      assert(secondOutcome.status === 'resolved', this.settleFailure('post-recovery updateNode', secondOutcome));
      assert(
        (nodeAfterRecovery?.data as { label?: string })?.label === 'S12: rejected once, then recovered',
        `the update lock must be released — the follow-up update must apply, got label '${(nodeAfterRecovery?.data as { label?: string })?.label}'`
      );
    });
  }

  // =============================================
  // 13. Commands await their nested emits: addToGroup internally emits
  // highlightGroupClear and must not resolve before it finished. Proven via
  // the MODEL (synchronous read): right after `await addToGroup` the group's
  // `highlighted` property must already be false again.
  // =============================================

  async testNestedEmitAwaited() {
    const groupId = this.nextId('grp');
    const nodeId = this.nextId('grp-member');
    const groupPos = this.nextRowPosition();
    this.skipRow(); // groups render taller than one row

    await this.modelService.addNodes([
      { id: groupId, position: groupPos, data: { label: 'S13: group' }, isGroup: true },
      { id: nodeId, position: { x: groupPos.x + 320, y: groupPos.y }, data: { label: 'S13: joins the group' } },
    ]);
    const member = this.getNode(nodeId)!;

    await this.groupsService.highlightGroup(groupId, [member]);
    const highlightedAfterAwait = (this.getNode(groupId) as GroupNode | undefined)?.highlighted === true;
    await sleep(VISUAL_PAUSE_MS); // let the highlight be seen

    const t1 = performance.now();
    await this.groupsService.addToGroup(groupId, [nodeId]);
    const memberAfter = this.getNode(nodeId);
    const groupAfter = this.getNode(groupId) as GroupNode | undefined;

    this.addResult('S13 · addToGroup awaits its nested highlight-clear emit', performance.now() - t1, (assert) => {
      assert(highlightedAfterAwait, `group.highlighted must read true synchronously after awaited highlightGroup`);
      assert(memberAfter?.groupId === groupId, `node.groupId must be set synchronously after the await`);
      assert(
        groupAfter?.highlighted === false,
        `group.highlighted must already be false right after the await — addToGroup must await its nested highlightGroupClear emit, got '${groupAfter?.highlighted}'`
      );
    });
  }

  // =============================================
  // 14. waitForMeasurements tracking must belong to ITS OWN update pass.
  // A concurrent un-awaited update (slowed by a middleware so it genuinely
  // overlaps) must not consume the tracking request — pre-fix it registered
  // the decoy's entities as participants and the promise resolved before the
  // added node was measured.
  // =============================================

  async testTrackingNotHijacked() {
    const victimId = this.nextId('hijack-decoy');
    const victim = this.makeNode(victimId, 'S14: concurrent decoy update');
    await this.modelService.addNodes([victim]);

    const delayingMiddleware: Middleware = {
      name: 'awaitable-test-hijack-delay',
      execute: async (context, next) => {
        // Delay ONLY the decoy's pass — delaying every pass would also slow the
        // measurement-application pass and race the tracker's discovery window,
        // making the scenario flaky for reasons unrelated to the hijack.
        if (context.initialUpdate.nodesToUpdate?.some((n) => n.id === victimId)) {
          await sleep(30);
        }
        await next();
      },
    };
    const unregister = this.ngDiagramService.registerMiddleware(delayingMiddleware);
    const addedId = this.nextId('hijack-add');
    const t1 = performance.now();

    try {
      // Deliberately NOT awaited — this update holds the update lock while the
      // tracked addNodes below commits behind it.
      const decoy = this.modelService.updateNode(victimId, {
        position: { x: victim.position.x + 120, y: victim.position.y },
      });

      const outcome = await this.settleWithin(
        this.modelService.addNodes([this.makeNode(addedId, 'S14: measured despite the decoy')], {
          waitForMeasurements: true,
        })
      );
      const node = this.getNode(addedId);
      await decoy.catch(() => undefined);

      this.addResult(
        'S14 · waitForMeasurements not hijacked by a concurrent update',
        performance.now() - t1,
        (assert) => {
          assert(outcome.status === 'resolved', this.settleFailure('addNodes(waitForMeasurements)', outcome));
          assert(
            (node?.size?.width ?? 0) > 0 && (node?.size?.height ?? 0) > 0,
            `the added node must be measured on resolve even with a concurrent update in flight (pre-fix the decoy consumed the tracking request), got ${node?.size?.width}x${node?.size?.height}`
          );
        }
      );
    } finally {
      unregister();
    }
  }

  zoomToTestArea(): void {
    this.viewportService.zoomToFit();
  }

  // =============================================
  // Helpers
  // =============================================

  /**
   * All test nodes are stacked in ONE column so every scenario is easy to
   * follow visually. The column starts in the currently visible part of the
   * canvas (computed from the viewport on first use) and grows downward.
   */
  private columnOrigin: Point | null = null;
  private row = 0;

  private nextRowPosition(): Point {
    if (!this.columnOrigin) {
      // A client point inside the visible canvas, right of the palette.
      this.columnOrigin = this.viewportService.clientToFlowPosition({ x: 320, y: 160 });
    }
    return { x: this.columnOrigin.x, y: this.columnOrigin.y + this.row++ * ROW_HEIGHT };
  }

  /** Returns the reserved row when a node deliberately never materializes (rollback). */
  private releaseRow(): void {
    this.row = Math.max(0, this.row - 1);
  }

  private nextId(prefix: string): string {
    return `awt-${prefix}-${this.idCounter++}`;
  }

  private makeNode(id: string, label: string, position?: Point): Node {
    return {
      id,
      position: position ?? this.nextRowPosition(),
      data: { label },
    };
  }

  private getNode(id: string): Node | undefined {
    return this.modelService
      .getModel()
      .getNodes()
      .find((n) => n.id === id);
  }

  private getEdge(id: string): Edge | undefined {
    return this.modelService
      .getModel()
      .getEdges()
      .find((e) => e.id === id);
  }

  /**
   * Awaits a promise with a hard timeout so a regression (hung update lock,
   * hung waitForMeasurements) shows up as a FAILED test instead of freezing
   * the panel forever.
   */
  private async settleWithin(promise: Promise<unknown>): Promise<SettleOutcome> {
    const TIMEOUT = Symbol('timeout');
    try {
      const result = await Promise.race([promise, sleep(SETTLE_TIMEOUT_MS).then(() => TIMEOUT)]);
      return result === TIMEOUT ? { status: 'timeout' } : { status: 'resolved' };
    } catch (error) {
      return { status: 'rejected', error };
    }
  }

  private settleFailure(what: string, outcome: SettleOutcome): string {
    if (outcome.status === 'timeout') {
      return `${what} did not settle within ${SETTLE_TIMEOUT_MS}ms — possible frozen update lock or hung waitForMeasurements`;
    }
    if (outcome.status === 'rejected') {
      return `${what} unexpectedly rejected: ${String(outcome.error)}`;
    }
    return '';
  }

  private captureWarnings(): { messages: string[]; restore: () => void } {
    const original = console.warn;
    const messages: string[] = [];
    console.warn = (...args: unknown[]) => {
      messages.push(args.map(String).join(' '));
      original.apply(console, args);
    };
    return { messages, restore: () => (console.warn = original) };
  }

  private captureErrors(): { messages: string[]; restore: () => void } {
    const original = console.error;
    const messages: string[] = [];
    console.error = (...args: unknown[]) => {
      messages.push(args.map(String).join(' '));
      original.apply(console, args);
    };
    return { messages, restore: () => (console.error = original) };
  }

  /** Skips one column row (e.g. groups render taller than a single row). */
  private skipRow(): void {
    this.row++;
  }

  private addResult(
    name: string,
    elapsed: number,
    assertions: (assert: (condition: boolean, message: string) => void) => void,
    infoDetails?: string
  ) {
    const failures: string[] = [];
    assertions((condition, message) => {
      if (!condition) failures.push(message);
    });
    const passed = failures.length === 0;
    const details = passed ? (infoDetails ?? 'All assertions passed') : failures.join('; ');
    console.log(`[AwaitableTest] ${passed ? '✅ PASS' : '❌ FAIL'}: ${name} (${elapsed.toFixed(0)}ms)`);
    if (!passed) failures.forEach((f) => console.log(`  ❌ ${f}`));
    // Upsert by scenario name: re-running a scenario replaces its row. The
    // results list is rendered with `track result.name` — appending duplicates
    // would produce NG0955 (duplicated track keys) on every change detection.
    this.results.update((r) => {
      const entry = { name, passed, elapsed, details, failures };
      const index = r.findIndex((existing) => existing.name === name);
      if (index === -1) {
        return [...r, entry];
      }
      const copy = [...r];
      copy[index] = entry;
      return copy;
    });
  }
}
