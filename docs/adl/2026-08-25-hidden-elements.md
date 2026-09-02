# Hidden elements: the `hidden` flag and effective visibility

**Date**: 2026-08-25
**Status**: Accepted

## Context

There was no visibility concept in the model. Content hidden with CSS `display: none` (e.g. collapsed children in an expand/collapse pattern) broke the measurement system twice:

- **At initialization**: ResizeObserver reports 0×0 for hidden elements, which fails `isValidSize()`, so the element never counts as measured and init blocks until the 2-second safety timeout (`MEASUREMENT_TIMEOUT`) force-finishes with console warnings. Every model load with hidden content paid the 2 s penalty.
- **At runtime**: hiding an observed element makes ResizeObserver deliver 0×0, which overwrote node/port/label geometry in the model — the apply paths had no validity guard.

## Decision

Hidden content is a first-class concept built from four pieces:

### The library claims the `hidden` property name on nodes and edges

`hidden?: boolean` on `SimpleNode` and `Edge`; absent means visible. `hidden` was chosen over `visible` because absence then means the normal state and the collision risk with app-level data is smaller. Users set it; the library only reads it.

**Release note**: nothing strips unknown properties, so pre-existing app-level `hidden: true` data activates the new semantics on upgrade — there is no compile-time signal.

### Effective visibility is derived and system-computed

A node is effectively hidden when its own flag (or a template-level hidden binding) is set or any ancestor group is effectively hidden; an edge when its own flag/binding is set or either endpoint node is effectively hidden. The derived value is stamped on the model as the readonly `computedHidden` property (mirroring the `zOrder` → `computedZIndex` precedent) by an always-on `hidden-computation` middleware that runs **before** user middlewares. Stamping — rather than a lookup cache — was chosen because Angular's OnPush rendering only reacts to changed object references: a child whose ancestor group was hidden must receive a new node object for its `display` binding to update. Every downstream consumer (rendering, spatial hash, selection, routing, bounds, virtualization, measurement tracking) reads `computedHidden`, never raw flags. `computedHidden` is stripped by the persistence strip helpers.

Template-declared hidden state (the `hidden` inputs on ports/labels and the `[ngDiagramHidden]` directive) reaches core through a `TemplateVisibilityRegistry` on `FlowCore`, written by the rendering layer; node/edge registry changes run a `templateVisibilityChange` middleware pass, and during initialization registry changes prune measurement expectations.

**Reactive-context constraint**: any registry write issued from a reactive context (an Angular effect) must be wrapped in `untracked`. A write can synchronously complete initialization (`refreshHiddenEntities()` → `tryFinish()` → `finish()` → `setState()`), which writes model signals — and signal writes inside an effect throw NG0600 before Angular 19, which the peer deps allow (`>=18`). Tests run on 19.x and never see the error, so this is enforced by convention: the directive and the port/label components all wrap their registry writes.

### Rendering keeps hidden elements mounted

The node/edge host components apply `[style.display]="computedHidden ? 'none' : null"`. The library never sets an inline display value on visible elements — that would break existing user CSS `display:none` workarounds, the exact population this feature targets. Hidden elements stay mounted (never `@if`-destroyed), so unhiding re-measures through the existing ResizeObserver path.

### The zero-size guard is independent of the flag

0×0 measurement reports (the `display: none` signature) never overwrite existing geometry — with or without the flag. The guard deliberately rejects only both-zero reports, not a blanket `isValidSize` check: a legitimately degenerate 200×0 measurement from visible content must still apply, or sizes freeze at their last-known values. Per the campaign rollback criteria this guard is never rolled back: it fixes data corruption.

### Resolved open decisions

- **Hiding does not auto-deselect.** A hidden element keeps its `selected` flag, but every interaction surface excludes it, so it cannot be moved or manipulated while invisible.
- **`deleteSelection` skips effectively hidden selected elements** — deleting content the user cannot see would be destructive. Descendants of a deleted visible group and edges of deleted nodes are removed regardless of their own hidden state (no orphans, no dangling edges).
- **Edge attached to a hidden port**: the edge keeps the port's last measured geometry as its anchor (the simplest behavior). Deciding what to do with such an edge is up to the user — e.g. hide it with its own `hidden`.
- **Automatic detection rejected**: inferring hidden from 0×0 reports was considered and rejected — 0×0 can also be a genuine measurement error, so the declarative flag is the reliable signal; the zero-size guard handles the corruption side independently.

## Backward compatibility

- New optional properties (`hidden`, `computedHidden`) and new optional component inputs — no breaking API changes.
- Visible elements get no inline styles, so existing CSS keeps working. Raw CSS `display:none` no longer corrupts geometry (zero-size guard) but still pays the init penalty — the flag/input is the supported pattern.
- Apps that already stored `hidden: true` on nodes/edges will see those elements disappear after the upgrade (see release note above).

## Alternatives considered

- **`visible?: boolean`** — rejected: absence would mean the _special_ state or require defaulting every element.
- **Effective-visibility cache in `ModelLookup`** (invalidated in `desynchronize()`) — rejected in favor of stamping: a cache alone cannot re-render OnPush children of a hidden group (unchanged object references), and every consumer would need to reach the lookup instead of reading the element.
- **Inferring hidden from 0×0 measurements** — rejected, see above.

## Post-implementation audit: triage outcomes (2026-08-27)

Two adversarial audit rounds ran over every surface the feature touches. Round-1 bugs and most
round-2 bugs were fixed on the feature branch with regression tests. The remaining outcomes —
won't-fix decisions, accepted limitations, and follow-up tasks — are recorded here so they don't
have to be re-derived.

### Won't fix

- **Unhide mid-drag: the late joiner corrupts the gesture.** A still-selected node unhidden by app
  logic in the middle of an active drag joins the move set on the next `continue`, but the
  gesture's `initialPositions`/`dragging.nodeIds` were captured once at threshold — Escape restores
  only the captured ids, drag events never report the late joiner, and it joins from its original
  position while its peers are already offset. Rejected as not worth the gesture-bookkeeping
  complexity for a one-in-a-million interleaving; revisit if it surfaces in practice. (Candidate
  fix if it does: freeze the move set at threshold, or register late joiners into the captured
  state on entry.)
- **Model-driven `hidden` during initialization still stalls the 2 s timeout.**
  `InitUpdater.refreshHiddenEntities()` is wired only to the template-registry callbacks, so
  `updateNode(id, { hidden: true })` landing mid-init leaves the node in `nodesToMeasure` until
  `MEASUREMENT_TIMEOUT` force-finishes with a warning. Racing model updates against initialization
  is not a supported pattern — set `hidden` in the initial model or from `onInit`; the force-finish
  self-heals.

### Accepted limitations

- **"Stays mounted as `display: none`" holds in direct mode only.** Under virtualization,
  effectively hidden elements are excluded from the render set and unmounted — per spec, and safe:
  the model keeps `size`/`measuredPorts`/`measuredLabels`, so remounting re-measures normally.
- **`sendToBack` on a hidden selected node re-orders its visible ancestors** — z-order ancestor
  propagation walks whatever is selected, hidden or not; with no explicit ids a bare `sendToBack()`
  falls back to the raw (unfiltered) selection. Invisible cause, visible effect; rare enough to
  defer. Candidate fix: filter `getCommandTarget` on `computedHidden` in `z-order.ts`.
- **`centerOnNode(hiddenId)` silently centers on invisible content** — the viewport APIs disagree
  on hidden policy (`zoomToFit` excludes hidden via bounds computation; `centerOnNode` builds its
  rect from raw `position`/`size`, no warning). Decide one policy or document the asymmetry when
  next touching the viewport APIs.
- **`highlightGroup` on a hidden group parks an invisible sticky highlight** — `highlighted: true`
  is stamped with nothing to clear it, so the group renders highlighted when later unhidden. The
  stickiness pre-exists for visible groups. Candidate fix: refuse or auto-clear highlight on hidden
  targets.
- **Hide-then-unhide before pointer release teleports the node** — the gesture's pointer anchor
  freezes while the dragged node is hidden; unhiding before release applies the accumulated travel
  in one frame. Staying hidden until release is harmless.
- **Keyboard-move auto-pan uses the full movable set** — the viewport can pan toward hidden
  descendants of a moved group. Cosmetic; candidate fix: compute `panViewportIfNeeded` from visible
  movers only.
- **Selection semantics**: programmatic `select()` may target hidden elements (deliberate —
  programmatic selection is the user's prerogative; only interactive surfaces filter), hiding does
  not deselect, box selection incidentally clears hidden-selected elements, and
  `selectionChanged`/drag events include hidden ids — consumers can filter on `computedHidden`.
- **Pre-init spatial-hash window** — between first model processing and the init stamp, hidden
  nodes sit unstamped in the spatial hash. Pointer interaction cannot reach them (canvas is
  `visibility: hidden` until after the init pass), but programmatic spatial queries before
  `diagramInit` can see them. The pre-init window is not a supported query window.
- **`TemplateVisibilityRegistry` lifetime is tied to `FlowCore`** (model re-init creates a fresh
  registry; removed elements are pruned by the hidden-computation pass). Remaining stale-entry
  windows: a directive destroy during the initial init window (the `!flowCore.isInitialized` guard
  keeps the entry while the element stays in the model), and a port removed via `@if` while its
  node is virtualized-out (self-heals on remount).
- **The replaced-with-same-id teardown guard is vacuous for initial-model elements** —
  `_internalId` is only assigned to elements added via `nodesToAdd`/`edgesToAdd`; initial-model
  elements have none, so the guard is skipped for them. Angular's create-before-destroy effect
  ordering masks it in practice.
- **`templateVisibilityChange` passes queue into an in-flight transaction** — a registry write
  raised mid-gesture is deferred to commit, so `computedHidden` can lag the registry for the
  gesture's duration. Not observed to break anything.
- **`invalidateMeasurements` counts hidden elements as participants** — a call touching only hidden
  elements waits one discovery window (~70 ms) before resolving; cannot hang (timer-driven).

### Follow-up tasks

- [NGD-317](https://app.clickup.com/t/86cbanwwx) — `zoomToFit({ nodeIds })` without `edgeIds` fits
  the entire edge network (pre-existing shape, made a live surprise by hidden filtering).
- [NGD-320](https://app.clickup.com/t/86cbd99n5) — `deleteNodes` on a group leaves children with a
  dangling `groupId`; previously hidden children reappear as orphans. Decision: at minimum clear
  the children's `groupId`. Until fixed, the guide's "deleting a group deletes its hidden children"
  holds for `deleteSelection` only — the docs cascade distinction is deliberately deferred to this
  task.
- [NGD-321](https://app.clickup.com/t/86cbd99p1) — `draggable: false` on a group should freeze its
  whole subtree. Decision: nothing moves, visible descendants included (the moving visible half is
  a pre-existing bug surfaced by hidden descendants now correctly staying put).
- `NgDiagramService.startLinking` JSDoc: the hidden-source refusal behavior is documented in code
  but the docs guide note was deferred while the linking refusal paths settled — fold into the next
  docs pass.
