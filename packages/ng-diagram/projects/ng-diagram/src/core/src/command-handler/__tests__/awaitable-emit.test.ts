import { describe, expect, it, vi } from 'vitest';
import {
  createInMemoryModelAdapter as createModelAdapter,
  createTestFlowCore as createFlowCore,
  macrotask,
} from '../../test-utils';
import type { Middleware } from '../../types';
import type { TransactionOptions } from '../../types/transaction.interface';

describe('awaitable emit (integration)', () => {
  it('should resolve emit only after the adapter received the write, even with a macrotask-async middleware', async () => {
    const model = createModelAdapter();
    const delayingMiddleware: Middleware = {
      name: 'macrotask-delay',
      execute: async (_context, next) => {
        await macrotask();
        await next();
      },
    };
    const flowCore = createFlowCore(model, [delayingMiddleware]);

    await flowCore.commandHandler.emit('addNodes', {
      nodes: [{ id: 'node-1', type: 'node', selected: false, position: { x: 0, y: 0 }, data: {} }],
    });

    // If the command promise were dropped anywhere along emit -> command -> applyUpdate,
    // emit would resolve on a microtask while the middleware still waits on its macrotask,
    // and the node would not be in the model yet.
    expect(model.getNodes()).toContainEqual(expect.objectContaining({ id: 'node-1' }));

    await flowCore.commandHandler.emit('updateNodes', {
      nodes: [{ id: 'node-1', position: { x: 42, y: 24 } }],
    });

    expect(model.getNodes()).toContainEqual(expect.objectContaining({ id: 'node-1', position: { x: 42, y: 24 } }));

    flowCore.destroy();
  });

  it('should not lose updates when a fire-and-forget nested transaction outlives its parent', async () => {
    const model = createModelAdapter();
    const flowCore = createFlowCore(model, []);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await flowCore.commandHandler.emit('addNodes', {
      nodes: [{ id: 'node-1', type: 'node', selected: false, position: { x: 0, y: 0 }, data: {} }],
    });

    let releaseInner: () => void = () => undefined;
    let innerPromise: Promise<unknown> | undefined;

    // Outer root transaction whose callback fires a nested transaction without awaiting it
    await flowCore.transaction(async (tx) => {
      await tx.emit('addNodes', {
        nodes: [{ id: 'node-2', type: 'node', selected: false, position: { x: 10, y: 10 }, data: {} }],
      });
      innerPromise = flowCore.transaction('updateNodes', async (tx2) => {
        await new Promise<void>((resolve) => {
          releaseInner = resolve;
        });
        await tx2.emit('updateNodes', { nodes: [{ id: 'node-1', position: { x: 99, y: 99 } }] });
      });
    });

    // The outer transaction's commit must reach the model even though the nested
    // transaction is still open on the stack.
    expect(model.getNodes()).toContainEqual(expect.objectContaining({ id: 'node-2' }));

    releaseInner();
    await innerPromise;

    // The orphaned nested transaction's update must not be silently dropped.
    expect(model.getNodes()).toContainEqual(expect.objectContaining({ id: 'node-1', position: { x: 99, y: 99 } }));

    warn.mockRestore();
    flowCore.destroy();
  });

  it('should register the waitForMeasurements transaction own entities even with another update queued ahead', async () => {
    const model = createModelAdapter();
    const delayingMiddleware: Middleware = {
      name: 'macrotask-delay',
      execute: async (_context, next) => {
        await macrotask();
        await next();
      },
    };
    const flowCore = createFlowCore(model, [delayingMiddleware]);

    await flowCore.commandHandler.emit('addNodes', {
      nodes: [{ id: 'node-1', type: 'node', selected: false, position: { x: 0, y: 0 }, data: {} }],
    });

    const registerSpy = vi.spyOn(flowCore.measurementTracker, 'registerParticipants');

    // Un-awaited update holds the semaphore while the transaction below commits —
    // its pass must NOT consume the transaction's tracking request.
    const inFlight = flowCore.commandHandler.emit('updateNodes', {
      nodes: [{ id: 'node-1', position: { x: 5, y: 5 } }],
    });

    await flowCore.transaction(
      async (tx) => {
        await tx.emit('addNodes', {
          nodes: [{ id: 'node-2', type: 'node', selected: false, position: { x: 10, y: 10 }, data: {} }],
        });
      },
      {
        waitForMeasurements: true,
        _measurementDiscoveryWindowTimeout: 5,
        _measurementDebounceTimeout: 5,
      } as TransactionOptions
    );

    await inFlight;

    expect(registerSpy).toHaveBeenCalledTimes(1);
    expect(registerSpy.mock.calls[0][0]).toEqual(['node:node-2']);

    flowCore.destroy();
  });

  it('should clear a staged tracking request when the pass is cancelled by a middleware', async () => {
    const model = createModelAdapter();
    const cancellingMiddleware: Middleware = {
      name: 'cancel-all',
      execute: (_context, _next, cancel) => {
        cancel();
      },
    };
    const flowCore = createFlowCore(model, [cancellingMiddleware]);

    await flowCore.transaction(
      async (tx) => {
        await tx.emit('addNodes', {
          nodes: [{ id: 'node-1', type: 'node', selected: false, position: { x: 0, y: 0 }, data: {} }],
        });
      },
      { waitForMeasurements: true }
    );

    // A stale staged request would be consumed by the next unrelated pass,
    // registering the wrong participants.
    expect(flowCore.measurementTracker.isTrackingRequested()).toBe(false);

    flowCore.destroy();
  });

  it('should warn when waitForMeasurements is passed to a nested transaction', async () => {
    const model = createModelAdapter();
    const flowCore = createFlowCore(model, []);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await flowCore.transaction(async () => {
      await flowCore.transaction(
        async (tx) => {
          await tx.emit('addNodes', {
            nodes: [{ id: 'node-1', type: 'node', selected: false, position: { x: 0, y: 0 }, data: {} }],
          });
        },
        { waitForMeasurements: true }
      );
    });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('nested transaction'));
    warn.mockRestore();
    flowCore.destroy();
  });

  it('should resolve (not hang or reject) an awaited emit whose update is cancelled by a middleware', async () => {
    const model = createModelAdapter();
    let cancelUpdates = false;
    const cancellingMiddleware: Middleware = {
      name: 'conditional-cancel',
      execute: (_context, next, cancel) => {
        if (cancelUpdates) {
          cancel();
          return;
        }
        next();
      },
    };
    const flowCore = createFlowCore(model, [cancellingMiddleware]);

    cancelUpdates = true;
    await expect(
      flowCore.commandHandler.emit('addNodes', {
        nodes: [{ id: 'node-1', type: 'node', selected: false, position: { x: 0, y: 0 }, data: {} }],
      })
    ).resolves.toBeUndefined();

    expect(model.getNodes()).toEqual([]);

    flowCore.destroy();
  });

  it('should report (not swallow) a middleware error thrown after it cancelled the pass', async () => {
    const model = createModelAdapter();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let misbehave = false;
    const cancelThenThrowMiddleware: Middleware = {
      name: 'cancel-then-throw',
      execute: (_context, next, cancel) => {
        if (misbehave) {
          cancel();
          // The pass is already settled — this error cannot reject it, but it
          // must not vanish silently either.
          throw new Error('exploded after cancel');
        }
        next();
      },
    };
    const flowCore = createFlowCore(model, [cancelThenThrowMiddleware]);

    try {
      misbehave = true;
      await expect(
        flowCore.commandHandler.emit('addNodes', {
          nodes: [{ id: 'node-1', type: 'node', selected: false, position: { x: 0, y: 0 }, data: {} }],
        })
      ).resolves.toBeUndefined();

      expect(model.getNodes()).toEqual([]);
      expect(
        errorSpy.mock.calls.some((call) => call.some((arg) => String(arg).includes('exploded after cancel')))
      ).toBe(true);
    } finally {
      errorSpy.mockRestore();
      flowCore.destroy();
    }
  });

  it('should resume an upstream middleware awaiting next() when a downstream middleware cancels, and report its late error', async () => {
    const model = createModelAdapter();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let cancelUpdates = false;
    let resumed = false;
    const upstreamMiddleware: Middleware = {
      name: 'awaiting-upstream',
      execute: async (_context, next) => {
        // cancel() must resolve this suspended await (with the initial state)
        // so catch/finally cleanup in upstream middlewares still runs.
        await next();
        resumed = true;
        if (cancelUpdates) {
          throw new Error('late error after cancel');
        }
      },
    };
    const cancellingMiddleware: Middleware = {
      name: 'conditional-cancel',
      execute: (_context, next, cancel) => {
        if (cancelUpdates) {
          cancel();
          return;
        }
        next();
      },
    };
    const flowCore = createFlowCore(model, [upstreamMiddleware, cancellingMiddleware]);

    try {
      cancelUpdates = true;
      await expect(
        flowCore.commandHandler.emit('addNodes', {
          nodes: [{ id: 'node-1', type: 'node', selected: false, position: { x: 0, y: 0 }, data: {} }],
        })
      ).resolves.toBeUndefined();

      expect(model.getNodes()).toEqual([]);
      // The upstream continuation runs on a follow-up microtask; its late error
      // then goes through the settled branch.
      await macrotask();
      expect(resumed).toBe(true);
      expect(
        errorSpy.mock.calls.some((call) => call.some((arg) => String(arg).includes('late error after cancel')))
      ).toBe(true);
    } finally {
      errorSpy.mockRestore();
      flowCore.destroy();
    }
  });

  it('should report (not swallow) a middleware error thrown after the pass completed', async () => {
    const model = createModelAdapter();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let misbehave = false;
    const throwAfterAwaitMiddleware: Middleware = {
      name: 'throw-after-await',
      execute: async (_context, next) => {
        await next();
        if (misbehave) {
          // Runs after the chain completed and the pass settled — same rule.
          throw new Error('exploded after completion');
        }
      },
    };
    const flowCore = createFlowCore(model, [throwAfterAwaitMiddleware]);

    try {
      misbehave = true;
      await flowCore.commandHandler.emit('addNodes', {
        nodes: [{ id: 'node-1', type: 'node', selected: false, position: { x: 0, y: 0 }, data: {} }],
      });

      // The pass committed normally; the late error surfaces on a follow-up tick.
      expect(model.getNodes()).toContainEqual(expect.objectContaining({ id: 'node-1' }));
      await macrotask();
      expect(
        errorSpy.mock.calls.some((call) => call.some((arg) => String(arg).includes('exploded after completion')))
      ).toBe(true);
    } finally {
      errorSpy.mockRestore();
      flowCore.destroy();
    }
  });

  it('should reject the awaited emit when a middleware throws and still release the update lock', async () => {
    const model = createModelAdapter();
    let shouldThrow = false;
    const throwingMiddleware: Middleware = {
      name: 'conditional-thrower',
      execute: (_context, next) => {
        if (shouldThrow) {
          throw new Error('middleware exploded');
        }
        next();
      },
    };
    const flowCore = createFlowCore(model, [throwingMiddleware]);

    shouldThrow = true;
    await expect(
      flowCore.commandHandler.emit('addNodes', {
        nodes: [{ id: 'node-1', type: 'node', selected: false, position: { x: 0, y: 0 }, data: {} }],
      })
    ).rejects.toThrow('middleware exploded');

    // The update lock must be released — the next update goes through normally
    shouldThrow = false;
    await flowCore.commandHandler.emit('addNodes', {
      nodes: [{ id: 'node-2', type: 'node', selected: false, position: { x: 10, y: 10 }, data: {} }],
    });
    expect(model.getNodes()).toContainEqual(expect.objectContaining({ id: 'node-2' }));

    flowCore.destroy();
  });

  it('should not run remaining middlewares when a suspended middleware resumes after the pass failed', async () => {
    const model = createModelAdapter();
    let shouldThrow = false;
    let releaseSuspended: (() => void) | null = null;
    let suspendedOutcome: 'resolved' | 'rejected' | null = null;
    let downstreamRuns = 0;

    const throwingMiddleware: Middleware = {
      name: 'throws-after-next',
      execute: (_context, next) => {
        next();
        if (shouldThrow) {
          // Ordinary post-next() bug — fails the pass while the middleware
          // dispatched by next() is still suspended.
          throw new Error('post-next failure');
        }
      },
    };
    const suspendedMiddleware: Middleware = {
      name: 'suspended-before-next',
      execute: async (_context, next) => {
        if (releaseSuspended !== null) {
          throw new Error('test setup: only one suspension expected');
        }
        await new Promise<void>((resolve) => {
          releaseSuspended = resolve;
        });
        try {
          await next();
          suspendedOutcome = 'resolved';
        } catch {
          suspendedOutcome = 'rejected';
        }
      },
    };
    const downstreamSpyMiddleware: Middleware = {
      name: 'downstream-spy',
      execute: (_context, next) => {
        downstreamRuns += 1;
        next();
      },
    };
    const flowCore = createFlowCore(model, [throwingMiddleware, suspendedMiddleware, downstreamSpyMiddleware]);

    shouldThrow = true;
    await expect(
      flowCore.commandHandler.emit('addNodes', {
        nodes: [{ id: 'node-1', type: 'node', selected: false, position: { x: 0, y: 0 }, data: {} }],
      })
    ).rejects.toThrow('post-next failure');

    // The suspended middleware resumes AFTER the pass failed and the semaphore
    // was released. Its next() must not run the rest of the chain against the
    // dead pass (that would hijack a live pass's measurement tracking and emit
    // phantom deferred events) — it must reject with the pass error instead.
    releaseSuspended!();
    await macrotask();
    expect(downstreamRuns).toBe(0);
    expect(suspendedOutcome).toBe('rejected');

    // A follow-up update runs the full chain normally.
    shouldThrow = false;
    releaseSuspended = null;
    const followUp = flowCore.commandHandler.emit('addNodes', {
      nodes: [{ id: 'node-2', type: 'node', selected: false, position: { x: 10, y: 10 }, data: {} }],
    });
    await macrotask();
    releaseSuspended!();
    await followUp;
    expect(downstreamRuns).toBe(1);
    expect(model.getNodes()).toContainEqual(expect.objectContaining({ id: 'node-2' }));

    flowCore.destroy();
  });

  it('should report (not swallow) a distinct error raised by an upstream middleware while the pass is failing', async () => {
    const model = createModelAdapter();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let shouldThrow = false;
    const upstreamWithBuggyCleanup: Middleware = {
      name: 'buggy-cleanup',
      execute: async (_context, next) => {
        try {
          await next();
        } catch {
          // A bug in the middleware's own error handling — a DIFFERENT error
          // than the one that failed the pass. It cannot reject the pass
          // (already rejected) but it must not vanish silently either.
          throw new Error('cleanup exploded');
        }
      },
    };
    const throwingMiddleware: Middleware = {
      name: 'conditional-thrower',
      execute: (_context, next) => {
        if (shouldThrow) {
          throw new Error('original failure');
        }
        next();
      },
    };
    const flowCore = createFlowCore(model, [upstreamWithBuggyCleanup, throwingMiddleware]);

    try {
      shouldThrow = true;
      // The caller sees the ORIGINAL failure...
      await expect(
        flowCore.commandHandler.emit('addNodes', {
          nodes: [{ id: 'node-1', type: 'node', selected: false, position: { x: 0, y: 0 }, data: {} }],
        })
      ).rejects.toThrow('original failure');

      // ...and the distinct cleanup error is reported, not swallowed.
      await macrotask();
      expect(errorSpy.mock.calls.some((call) => call.some((arg) => String(arg).includes('cleanup exploded')))).toBe(
        true
      );
    } finally {
      errorSpy.mockRestore();
      flowCore.destroy();
    }
  });

  it('should not surface unhandled rejections from fire-and-forget next() calls when a later middleware throws', async () => {
    const model = createModelAdapter();
    const fireAndForgetMiddleware: Middleware = {
      name: 'sync-fire-and-forget',
      execute: (_context, next) => {
        // Common sync-middleware pattern: next() without await — the returned
        // promise is floating. When a later middleware fails the pass, this
        // floating promise must not become an unhandled rejection.
        next();
      },
    };
    let shouldThrow = false;
    const throwingMiddleware: Middleware = {
      name: 'conditional-thrower',
      execute: (_context, next) => {
        if (shouldThrow) {
          throw new Error('boom');
        }
        next();
      },
    };
    const flowCore = createFlowCore(model, [fireAndForgetMiddleware, throwingMiddleware]);

    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => {
      unhandled.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);

    try {
      shouldThrow = true;
      await expect(
        flowCore.commandHandler.emit('addNodes', {
          nodes: [{ id: 'node-1', type: 'node', selected: false, position: { x: 0, y: 0 }, data: {} }],
        })
      ).rejects.toThrow('boom');

      // unhandledRejection is reported on a later macrotask — give it time
      await new Promise<void>((resolve) => setTimeout(resolve, 20));
      expect(unhandled).toEqual([]);
    } finally {
      process.removeListener('unhandledRejection', onUnhandled);
      flowCore.destroy();
    }
  });

  it('should deliver the real rejection to middlewares that await next() around a failing pass', async () => {
    const model = createModelAdapter();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let caughtByUpstream: unknown = null;
    const observingMiddleware: Middleware = {
      name: 'awaiting-observer',
      execute: async (_context, next) => {
        try {
          await next();
        } catch (error) {
          // The pre-attached no-op handler on next() must NOT mask awaiting
          // callers — catch/finally blocks around await next() must still run.
          caughtByUpstream = error;
          throw error;
        }
      },
    };
    let shouldThrow = false;
    const throwingMiddleware: Middleware = {
      name: 'conditional-thrower',
      execute: (_context, next) => {
        if (shouldThrow) {
          throw new Error('downstream failed');
        }
        next();
      },
    };
    const flowCore = createFlowCore(model, [observingMiddleware, throwingMiddleware]);

    try {
      shouldThrow = true;
      await expect(
        flowCore.commandHandler.emit('addNodes', {
          nodes: [{ id: 'node-1', type: 'node', selected: false, position: { x: 0, y: 0 }, data: {} }],
        })
      ).rejects.toThrow('downstream failed');

      expect(String(caughtByUpstream)).toContain('downstream failed');

      // Cascade rethrows of the ALREADY-REPORTED error must stay silent — the
      // caller's rejection is the single report; logging here would produce one
      // console error per awaiting middleware on every failing pass. Filter to
      // the executor's log signature: the init updater legitimately logs the
      // failed init emit with a different first argument.
      await macrotask();
      expect(errorSpy.mock.calls.filter((call) => call[0] === '[ngDiagram]')).toEqual([]);
    } finally {
      errorSpy.mockRestore();
      flowCore.destroy();
    }
  });

  it('should report a duplicate fire-and-forget next() call loudly and still complete the pass', async () => {
    const model = createModelAdapter();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let callNextTwice = false;
    const doubleNextMiddleware: Middleware = {
      name: 'double-next',
      execute: (_context, next) => {
        next();
        if (callNextTwice) {
          // Contract violation (fire-and-forget) — must be reported, not silent.
          next();
        }
      },
    };
    const flowCore = createFlowCore(model, [doubleNextMiddleware]);

    try {
      callNextTwice = true;
      await flowCore.commandHandler.emit('addNodes', {
        nodes: [{ id: 'node-1', type: 'node', selected: false, position: { x: 0, y: 0 }, data: {} }],
      });

      // The first next() chain completed — the update must be applied
      expect(model.getNodes()).toContainEqual(expect.objectContaining({ id: 'node-1' }));
      expect(
        errorSpy.mock.calls.some((call) => call.some((arg) => String(arg).includes('executed next() multiple times')))
      ).toBe(true);
    } finally {
      errorSpy.mockRestore();
      flowCore.destroy();
    }
  });

  it('should serialize two awaited emits through the semaphore in call order', async () => {
    const model = createModelAdapter();
    const delayingMiddleware: Middleware = {
      name: 'macrotask-delay',
      execute: async (_context, next) => {
        await macrotask();
        await next();
      },
    };
    const flowCore = createFlowCore(model, [delayingMiddleware]);

    await flowCore.commandHandler.emit('addNodes', {
      nodes: [{ id: 'node-1', type: 'node', selected: false, position: { x: 0, y: 0 }, data: {} }],
    });

    const order: string[] = [];
    const first = flowCore.commandHandler
      .emit('updateNodes', { nodes: [{ id: 'node-1', position: { x: 1, y: 1 } }] })
      .then(() => order.push('first'));
    const second = flowCore.commandHandler
      .emit('updateNodes', { nodes: [{ id: 'node-1', position: { x: 2, y: 2 } }] })
      .then(() => order.push('second'));

    await Promise.all([first, second]);

    expect(order).toEqual(['first', 'second']);
    expect(model.getNodes()).toContainEqual(expect.objectContaining({ id: 'node-1', position: { x: 2, y: 2 } }));

    flowCore.destroy();
  });
});
