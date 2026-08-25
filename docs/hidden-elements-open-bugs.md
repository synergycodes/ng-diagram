# Hidden elements — open bugs (round-2 audit, not yet fixed)

**Date**: 2026-08-25
**Status**: Confirmed by a second adversarial audit of the hidden-elements feature (NGD-101) and
of the first round of bug fixes. **None of these are fixed yet** — this file is the triage list.
Non-bug findings from the same audit live in
[hidden-elements-known-gaps.md](./hidden-elements-known-gaps.md).

All 3,154 unit tests and the e2e suite pass with these bugs present — each entry notes the test
that is missing. Paths are relative to `packages/ng-diagram/projects/ng-diagram/src`.

---

## High

### 1. `computedHidden` stamps on _added_ nodes/edges are reverted by `internal-id-assignment`

`hidden-computation` runs first in the chain (`core/src/middleware-manager/middleware-manager.ts:90`)
and stamps added elements via `nodesToAdd`/`edgesToAdd` — which the executor applies as a **full
map replace**. `internalIdMiddleware` (first of `BUILTIN_MIDDLEWARES`) then re-emits
`nodesToAdd`/`edgesToAdd` mapped from the **pristine initial update**
(`core/src/middleware-manager/middlewares/internal-id-assignment/internal-id-assignment.ts:41-50`),
replacing the stamped element with the original plus `_internalId`. The stamp never reaches the
committed state.

Reachable through public API:

- `addNodes([{ hidden: true, … }])` → node renders **visible** despite the flag.
- `addNodes([{ groupId: <collapsed group> }])` → new child renders visible inside a hidden group.
- `addEdges([{ …, target: <hidden node> }])` → edge renders as a line to nothing.
- **Paste of a template-hidden (registry) descendant** → the copied stale `computedHidden: true`
  survives on the pasted node with nothing to ever recompute it: permanently invisible **and**
  `selected: true` — the invisible-selection state the feature promises impossible.

Diagnostic signature: adding a hidden _group_ hides its pre-existing children (they travel via
`nodesToUpdate`, which merges) while the added group itself stays visible.

Why the suite misses it: toggle/init paths use `nodesToUpdate`/model-load; `internalIdMiddleware`
early-returns when nothing was added; `hidden-computation.test.ts` uses a mocked context and never
runs the real chain. `measuredBoundsMiddleware` uses the same `nodesToAdd` pattern **safely**
because it runs _after_ `internalId` — only `hidden-computation` violates the ordering constraint.

**Fix direction**: run the stamp after `internal-id-assignment` (or make `internalIdMiddleware`
re-emit from the _current_ update rather than `initialUpdate`). **Missing test**: an integration
test that runs the real `BUILTIN_MIDDLEWARES` chain end-to-end for `addNodes`/`addEdges`/`paste`
with hidden content.

### 2. `NgDiagramService.startLinking()` on a hidden node leaves phantom linking state

The linking handler installs `actionStateManager.linking` **before** emitting the command
(`core/src/input-events/handlers/linking/linking.handler.ts:33-42`); the command's hidden-source
guard warns and returns **without clearing it**
(`core/src/command-handler/commands/linking/start-linking.ts:20-23`), and
`manual-linking.service.ts:18-40` attaches four `document` listeners before any validation.

Consequences: `isLinking()` is permanently true → every subsequent pointer-drawn link is refused;
the interaction coordinator reports a gesture with no temporary edge; orphaned listeners survive
until the next click anywhere, which then runs a cancelled finish pass and emits a spurious
`edgeDrawEnded { success: false }` for a link that never started. Public-API-only (pointer paths
cannot reach hidden nodes). The CHANGELOG claim "no-op with a console warning" is true of the
command, false of the method.

**Fix direction**: validate before installing state/listeners, or clear the installed state on the
command's refusal paths. **Missing test**: service-level `startLinking(hiddenNode)` followed by a
normal pointer link.

---

## Medium

### 3. Unhide mid-drag: the late joiner corrupts the gesture

`draggableSelection()` is recomputed every `continue`, so a still-selected node unhidden mid-drag
joins the move set — but `gesture.initialPositions` and `dragging.nodeIds` were captured once at
threshold (`core/src/input-events/handlers/pointer-move-selection/pointer-move-selection.handler.ts:72-74`).
Escape restores only the captured ids → the late joiner stays permanently displaced;
`nodeDragStarted`/`nodeDragEnded` never report it; it joins from its original position while its
peers are already offset, breaking the selection's relative geometry.

**Fix direction**: freeze the gesture's move set at threshold (ignore membership changes
mid-gesture), or register late joiners into `initialPositions`/`dragging.nodeIds` on entry.
**Missing test**: unhide-mid-drag + Escape.

### 4. Hiding the gesture's element mid-gesture under virtualization strands lifecycle state

The hide unmounts the element immediately (render-set exclusion + prompt cache invalidation), and
every gesture directive's destroyed-mid-gesture escape hatch clears action state **without the
stop command** (`lib/directives/input-events/pointer-move-selection/…:33-41`, `resize…:29-37`,
`rotate…:28-36`, `linking…:28-38`). Result: `…Started` events with no `…Ended`, no
`edgeDrawEnded`, a drop-target group stuck with `highlighted: true`, and a dead gesture object
that makes a later `cancel()` return `true` spuriously. Direct mode is unaffected (element stays
mounted).

**Fix direction**: the destroyed-mid-gesture hatches should run the same teardown as `cancel()`
(emit the stop/cancelled pass, clear highlight). **Missing test**: virtualization e2e hiding the
dragged/resized/linked node mid-gesture, asserting paired lifecycle events.

### 5. `finishLinking` never re-validates the source's visibility

Hide the source after linking started: the target validates
(`core/src/command-handler/commands/linking/finish-linking.ts:31`), the edge is created, and the
middleware immediately stamps it `computedHidden: true` — the app receives `edgeDrawEnded` for a
phantom invisible edge. Asymmetric with the target rule and with `startLinking`'s own guard.

**Fix direction**: re-check the source in `validateTarget`/`finishLinking` and cancel with an
appropriate reason. **Missing test**: hide source between start and finish.

### 6. The temporary edge keeps rendering from a hidden source

It lives in action state, bypasses `hidden-computation`, is appended unconditionally after
`process()` (`core/src/render-strategy/base-render-strategy.ts:21-25`) and keeps being re-routed
(`edges-routing.ts:234-241`) — a rubber band dangling from nothing for the rest of the gesture,
in both render modes.

**Fix direction**: follows from #5 (cancel the gesture when the source hides), or skip
rendering/routing the temporary edge while its source is effectively hidden.

### 7. Model-driven `hidden` during init still stalls the 2 s timeout

`InitUpdater.refreshHiddenEntities()` is wired only to the template-registry callbacks
(`core/src/flow-core.ts:118-126`); a `updateNode(id, { hidden: true })` landing before init
completes leaves the node in `nodesToMeasure` until `MEASUREMENT_TIMEOUT` force-finishes with a
warning.

**Fix direction**: call `refreshHiddenEntities()` from the hidden-computation pass (or from
`applyUpdate`) while `!initUpdater.isInitialized`. **Missing test**: init-updater test hiding a
node via a model update mid-init.

### 8. `zoomToFit({ nodeIds: [hiddenId] })` fits the entire edge network

Passing only `nodeIds` leaves `targetEdges` as **all** edges
(`core/src/command-handler/commands/zoom-to-fit.ts:63-65`); the hidden node contributes null
bounds, the full edge network doesn't → the viewport frames everything, silently. The
"null bounds → no-op" premise only holds in an edge-free diagram. Pre-existing shape (any
`nodeIds`-only call behaves like this), turned into a live surprise by hidden filtering.

**Fix direction**: when `nodeIds` are given without `edgeIds`, restrict edges to those between the
target nodes (or none). **Missing test**: `zoomToFit` with hidden-only and mixed `nodeIds` in a
diagram with edges.

### 9. `getMovableSelection` walks `getParentChain` per hidden node per pointermove frame

`core/src/input-events/handlers/movable-selection.ts:28`. `getParentChain` enforces `isGroup` and
`console.error`s (`MODEL_INTEGRITY_*`) on violations, while the other visibility producers
(`buildDirectChildrenMap`, `computeHiddenNodeIds`) resolve parents by `groupId` alone. On a model
where a child's `groupId` points at a non-group: error spam **every frame for the whole drag**,
and the hidden child is silently stranded (excluded from the move) even though effective
visibility considers it hidden.

**Fix direction**: resolve ancestry the same way the visibility computation does (plain `groupId`
walk or membership in the already-expanded descendant sets) instead of `getParentChain`.
**Missing test**: movable-selection test with a non-group parent in the chain.

---

## Pre-existing issues surfaced by the audit (not caused by the hidden-elements feature)

Verified identical at `origin/main`; listed for awareness, tracked separately if desired:

- **Dead arrow keys with `nodeDraggingEnabled: false` and a visible selection** — `MovingAction`
  declines (config) while `PanningAction` declines (selection non-empty): neither handles.
- **Pasting a selected edge whose endpoints were not copied** attaches the duplicate edge to the
  **original** nodes (`copy-paste.ts` id-map fallback `nodeIdMap.get(edge.source) || edge.source`).
- **`NgDiagramClipboardService.paste(position)` makes `position` required**, so the command's
  default offset-paste branch (+20/+20) is unreachable from the public service.
