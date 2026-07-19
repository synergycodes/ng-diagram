# Awaitable command emits and service methods

**Date**: 2026-07-07
**Status**: Accepted

## Context

`CommandHandler.emit` was typed `Promise<void>`, but the promise it returned was hollow: the
constructor registered every command as `(command) => { fn(this, command); }`, discarding the
async command function's promise, and `CommandCallback` was typed `(command) => void`. As a
result `await emit(...)` resolved after roughly one microtask — racing the middleware pass.
With any async middleware, or a contended update semaphore, emit resolved BEFORE `setState`
applied the change. All mutating methods on the seven public services then dropped even that
promise, so users had no honest way to sequence work after a mutation ("add nodes, then
zoomToFit" required guesswork or `waitForMeasurements` transactions).

## Decision

1. `CommandCallback` widened to `(command) => void | Promise<void>` (internal type, not in the
   API report), and the constructor wrapper returns the command function's promise. `emit` now
   resolves only after the command completed — i.e. after the middleware chain ran and
   `setState` committed the change (deferred diagram events flush before resolution too).
2. Commands await their nested emits (`addToGroup` → `highlightGroupClear` was the one
   floating case).
3. Every mutating method on the public services returns the emit promise
   (`void` → `Promise<void>`).
4. Content-creating/updating methods (`addNodes`, `addEdges`, `updateNode(s)`, `updateEdge(s)`,
   `resizeNode`) accept `options?: { waitForMeasurements?: boolean }`, implemented via the NAMED
   transaction overload (`flowCore.transaction('addNodes', ...)`) so the deprecated-but-public
   `MiddlewareContext.modelActionType` still reports the command name. Measurement-wait
   semantics come from `MeasurementTracker`: a 70 ms discovery window plus a 50 ms rolling
   debounce, with no absolute cap.

### Required companions: gesture re-entrancy hardening

`PointerMoveSelectionEventHandler.handle()` is invoked un-awaited by the router. Once emits
genuinely await, a macrotask-async middleware lets the next pointermove interleave while the
previous one is suspended, which double-applied/lost movement (deltas were computed from
instance state mutated after the await). The handler now computes deltas from locals and
commits all instance state before the first suspension point; work resuming after the
`moveNodesStart` await is skipped if the gesture ended (or a new one started) meanwhile. The
`end` phase captures a gesture generation counter before its awaits and skips cleanup when a
new drag started in the meantime, so a fast re-drag is not clobbered. `start` fully
re-initializes gesture state (including `hasMoved`).

The same clear-after-await pattern existed in other flows and got identity guards (only clear
the action state if it still belongs to this gesture/command): resize end (`clearResize` after
`resizeNodeStop`), rotate end (`clearRotation` after `rotateNodeStop`), and
`highlightGroupClear` (`clearHighlightGroup` after its applyUpdate). Linking cannot use object
identity — the linking object is replaced (spread) on every pointer move and by the
edges-routing middleware during finishLinking's own applyUpdate, so an identity guard would
skip the clear and strand the temporary edge (caught by the linking e2e test). Instead it uses
a gesture stamp: `InternalLinkingActionState._gestureId`, assigned at every site that creates a
fresh linking state (the linking input handler and both start commands) and preserved by all
the spread copies. `finishLinking` and `finishLinkingToPosition` clear in `finally` only when
the current stamp matches the one captured at entry, so a new gesture started while the finish
was suspended (programmatic `startLinking` — the linking directive itself refuses to start
while `isLinking()`) is no longer wiped. This closed the previously documented fast-re-link
gap; `finishLinkingToPosition` also gained the clear-in-finally it was missing entirely.

Rejections are a companion concern: pre-change, a command function's rejection was swallowed
(the wrapper discarded the promise), so gesture cleanup always ran. Now that awaited emits can
reject (e.g. a user `config.grouping.canGroup` callback throwing during a drop), the drag,
resize, and rotate end-phase cleanups run in `finally` — otherwise leaked action state blocked
subsequent gestures and (via `isResizing()`) suppressed node measurements. The same applies to
`finishLinking` and `finishLinkingToPosition` (their stamp-guarded clears run in `finally`; user
callbacks `validateConnection`/`finalEdgeDataBuilder`/`computeEdgeId` run inside them) and to the
gesture directives — destroying a handle mid-gesture (node deleted while resizing/rotating/
linking) now clears the corresponding action state from `ngOnDestroy`. Initialization is
resilient too: a rejected `init` pass logs and completes instead of wedging the updater in init
mode. Finally, the middleware executor itself converts an uncaught middleware throw (or async
rejection) into a rejection of the whole pass — previously it left the pass suspended forever
with the update semaphore held, i.e. a frozen diagram. The promise returned by `next()` carries
a pre-attached no-op rejection handler on a branch, so the common fire-and-forget `next()`
pattern in sync middlewares does not surface one unhandled rejection per suspended middleware
when a pass fails; middlewares that `await next()` still observe the real rejection. `cancel()`
needs no such handler (it returns `void` and only ever resolves promises), but errors thrown
after the pass has settled — after `cancel()` or after the chain completed — cannot reject it
anymore and are reported via `console.error` instead of being silently swallowed (cascade
rethrows of an already-reported failure stay silent, like the duplicate-`next()` guard). Two
more corners from a follow-up adversarial round: (1) a middleware suspended across a settled
pass no longer resumes the remaining chain against it — its late `next()` settles with the pass
outcome (the pass error, or the initial state after a cancel) instead of dispatching a "zombie"
chain whose internal tail would consume a live pass's staged measurement-tracking request and
push phantom deferred events; (2) the cascade silence is error-identity-aware — a DISTINCT
error raised while a pass is failing (e.g. a bug in a middleware's own catch/cleanup path) is
reported via `console.error`, only rethrows of the already-reported error stay silent.

`waitForMeasurements` accuracy: the tracking request is staged inside the transaction's own
update pass, under the update semaphore (`applyUpdateToModel`), so a concurrent unrelated pass
cannot consume it and register the wrong participants; a pass cancelled by a middleware clears
the staged request in `finally`; and the option on a nested transaction logs a warning (its
updates are applied only when the root commits, so waiting there is meaningless).

Races the longer suspension window amplified were fixed at the source:

- `TransactionManager` removed completed transactions from its stack positionally (`pop()`); an
  un-awaited nested transaction still running when an outer one completed was popped instead,
  and its queued updates were silently discarded. Removal is now by identity; additionally a
  root transaction's committed result is applied via a direct path that bypasses the
  active-transaction routing in `applyUpdate` (it must not be re-queued into an unrelated
  transaction that opened while the root's callback was suspended), and a nested transaction
  whose parent already completed commits independently with a console warning instead of
  merging into the dead parent. The service-layer `waitForMeasurements` branches refuse to open
  their internal named transaction while another transaction is active (console warning, plain
  emit fallback) — the outer transaction owns the timing there.
- `BatchProcessor` flush generations could interleave once flush callbacks awaited full state
  passes (a delete from flush N applying after an add from flush N+1 for the same item);
  flushes are now chained so a generation starts only after the previous one finished, and each
  flush callback's rejection is isolated so one failing emit cannot discard the rest of the
  drained generation.

### `NgDiagramService.transaction` return type

The sync-callback overload declared `void` and the implementation detected async callbacks via
`result instanceof Promise` — a realm-sensitive check: an async callback created outside the
Zone.js-patched realm (Playwright `evaluate`, iframes, non-zone libraries) returns a native
promise that is NOT an instance of the patched global `Promise`, so the service silently took
the void path and discarded the commit promise (found by the awaitable-hardening e2e suite).
All overloads now return `Promise<TransactionResult>` unconditionally; the detection is gone.

## Backward compatibility

- **Type-level**: compatible for callers. `() => Promise<void>` stays assignable in return
  position; no parameter types narrowed; the new `options` parameters are optional. Two
  exceptions worth naming: consumers who SUBCLASS a service and override a mutating method
  with a `void` return will no longer compile (an override must be assignable to the base),
  and typed test doubles pinned to the old `void` signatures need updating. Both are
  compile-time-visible and mechanical to fix.
- **Behavior-level** (invisible to API Extractor, hence this entry): the promises returned by
  `emit` and the service methods now resolve LATER (after commit) than before (after ~1
  microtask). Code that awaited them and depended on resolving before the state was applied
  would be relying on a bug; no such pattern is known.
- **New invariant to document loudly**: a custom middleware must never await a mutating
  emit/service call — the middleware chain runs inside the non-reentrant update semaphore
  (`semaphore.ts` has no owner tracking; a second acquire parks forever), so the await
  deadlocks. Such code only "worked" before because the promise resolved early. Fire-and-forget
  calls queue safely behind the semaphore. Documented in the middlewares guide (danger aside).
- **Signals**: `NgDiagramModelService` signals still refresh via the `SignalModelAdapter`
  effect on Angular's scheduler, i.e. AFTER the awaited promise resolves. Making signals
  synchronously fresh is a separate decision (atomic synchronous notification), not part of
  this change.

## Alternatives considered

- Runtime warning when `emit` is awaited while the chain is executing on the same FlowCore —
  candidate for a follow-up; not included because detection is heuristic and unproven.
- Making service methods `async` fire-and-forget with a separate `whenApplied()` API — rejected;
  it duplicates the promise the command already produces and keeps the dishonest timing.
