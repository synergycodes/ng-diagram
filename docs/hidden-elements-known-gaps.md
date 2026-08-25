# Hidden elements — known gaps and deliberate limitations

**Date**: 2026-08-25
**Scope**: the hidden-elements feature (NGD-101: NGD-255/256/257/258). Companion to the ADL
entry [2026-08-25-hidden-elements](./adl/2026-08-25-hidden-elements.md).

This list is the outcome of two post-implementation audit rounds over every surface the feature
touches. The items below are **not** open bugs — they are behaviors that were reviewed and either
accepted, deferred, or scoped out, so the next person doesn't have to re-derive the reasoning.
Bugs found by round 1 (virtualization cache staleness, drop-on-group re-parenting, clipboard data
loss for collapsed groups, dead arrow keys, port-registry clear ordering, `ngDiagramHidden`
teardown) were fixed with regression tests. Bugs found by round 2 are **not yet fixed** and are
triaged in [hidden-elements-open-bugs.md](./hidden-elements-open-bugs.md).

## Rendering / virtualization

### "Stays mounted as `display: none`" holds in direct mode only

Under virtualization, effectively hidden elements are excluded from the render set and
therefore **unmounted**, not `display: none`'d. This is per spec (hidden elements must not be
re-added to the virtualized render set) and functionally safe: the model keeps `size`,
`measuredPorts` and `measuredLabels`, so remounting on unhide re-measures through the normal
observer path with no data loss.

### `ngDiagramHidden` (template-level node/edge hiding) is not supported with virtualization

Hiding a node/edge removes it from the virtualized render set, which destroys the very
template that declares the binding — the state could then never be un-declared (or, before the
fix, oscillated hide/unhide indefinitely). With virtualization enabled the directive is an
ignored no-op with a one-time console warning. Use the model-level `hidden` flag instead.
Port and label `hidden` inputs are unaffected (they live on templates of *visible* owners and
are re-declared on remount).

### Minimap draws hidden nodes (NGD-107, separate task)

`DirectMinimapStrategy.computeMinimapNodes` does not filter `computedHidden`, while the
minimap *bounds* (via `calculatePartsBounds`) do — hidden dots can render outside the bounds
rectangle. Tracked as NGD-107.

### Visibility-diff tracking costs O(N) per model change under virtualization

The result-cache invalidation on visibility toggles (round-1 fix) rebuilds hidden-id `Set`s for
nodes/edges on every model change — including every frame of a node drag, where the diff is always
empty. It sits next to the already-O(N) `spatialHash.process` on the same path, so complexity is
unchanged, but it is pure overhead in the mode built for very large diagrams. Candidate
optimization: gate the diff on a hidden-relevant change signal from the middleware pass instead of
recomputing sets, or track a cheap count + reference pair.

### Pre-init spatial-hash window

Between the first model processing and the `init` middleware pass that stamps
`computedHidden`, hidden nodes briefly sit unstamped in the spatial hash. Pointer interaction
cannot reach them (the canvas is `visibility: hidden` until after the init pass — verified: no
flash), but **programmatic** spatial queries issued before `diagramInit` can see them.
Accepted: the pre-init window is not a supported query window.

## Selection semantics (by design)

- **Programmatic `select()` may target hidden elements** and they appear in the public
  `selection` signal. Deliberate: `hidden` is user data and programmatic selection is the
  user's prerogative; only interactive surfaces (`selectAll`, box selection, pointer
  hit-testing) filter. All destructive/movement paths neutralize hidden-selected elements.
- **Hiding does not deselect.** A hidden element keeps `selected: true`, but cannot be moved,
  deleted (`deleteSelection` skips it), copied, re-parented, or used as a linking endpoint.
- **Box selection clears hidden-selected elements** as a side effect (it emits with
  `multiSelection: false`), which acts as an undocumented cleanup path. Harmless.
- **`selectionChanged`/`selectionGestureEnded` events include hidden-selected elements**;
  consumers can filter on `computedHidden` (present on the emitted objects).

## Interaction edge cases (accepted for now)

- **`sendToBack` on a hidden selected node re-orders its visible ancestors** — the ancestor
  z-order propagation walks the chain of whatever is selected, hidden or not. Invisible cause,
  visible effect; rare enough to defer. Candidate fix: filter `getCommandTarget` on
  `computedHidden` in `z-order.ts`. Amplifier: with no explicit ids, `bringToFront`/`sendToBack`
  fall back to the raw (unfiltered) selection — a bare `sendToBack()` can pick up hidden-selected
  nodes without the caller ever naming a hidden id. (`bringToFront` itself is harmless on hidden
  targets: no visible side effect.)
- **`centerOnNode(hiddenId)` silently centers on invisible content** — the viewport APIs disagree
  on hidden policy (`zoomToFit` excludes hidden via `calculatePartsBounds`; `centerOnNode` builds
  its rect from raw `position`/`size` with no check, and no warning). Decide one policy; at
  minimum document the asymmetry.
- **`highlightGroup` on a hidden group parks an invisible highlight** — `highlighted: true` is
  stamped with nothing to clear it (no drag in progress), so the group renders highlighted when
  later unhidden. The stickiness itself pre-exists for visible groups; hidden just makes it
  invisible until it surprises. Candidate fix: refuse (or auto-clear) highlight on hidden targets.
- **Group tearing with a non-draggable visible ancestor** — for a selected group with
  `draggable: false`, its *visible* descendants still move with a drag (pre-existing behavior)
  while its *hidden* descendants now stay (they require a moving ancestor). The two halves
  diverge. Either both should move or neither; needs a decision on what `draggable: false` on a
  group means for its children.
- **Hide-then-unhide before pointer release teleports the node** — while a dragged node is
  hidden, the gesture's `lastPointerPosition` anchor freezes; unhiding before release applies the
  entire accumulated pointer travel in one frame. Staying hidden until release is harmless (the
  oversized final delta is applied to an empty set).
- **`deleteNodes([groupId])` implicitly unhides the group's children** — unlike `deleteSelection`,
  `deleteNodes` does not cascade to descendants; children keep a dangling `groupId`, the missing
  parent counts as visible, and the (correctly prompt) re-stamp pops the previously hidden
  children into view as orphans. Arguably the only sane fallback, but surprising and undocumented
  — the docs' "deleting a group deletes its hidden children" holds for `deleteSelection` only.
- **Keyboard-move auto-pan uses the full movable set**, which (correctly) includes hidden
  descendants of a moved visible group — the viewport can pan toward content the user cannot
  see when a hidden child's last-known bounds extend past the group. Cosmetic; candidate fix:
  compute `panViewportIfNeeded` from visible movers only.
- **Group resize floor includes hidden children** when
  `config.resize.allowResizeBelowChildrenBounds: false` (default is `true`, which bypasses the
  constraint entirely): a collapsed group cannot be resized below its hidden children's
  bounds. Deliberately unfiltered for now — shrinking a group below content that will reappear
  on expand is itself debatable. Revisit with real feedback from collapse/expand users.
- **Drag/move events carry hidden nodes**: `selectionMoved`, `nodeDragStarted/Ended` include
  hidden descendants that moved with their group — factually correct (they did move), noted
  here because consumers may not expect ids they cannot see. Under virtualization,
  `diagramInit.renderedNodeIds` comes from the pre-stamp resolver pass and can include hidden
  elements.

## Derived-state boundaries

- **External/store-driven model mutations do not re-stamp `computedHidden`** — identical to
  the pre-existing behavior of `computedZIndex` and `measuredBounds`: system-computed props
  are stamped only by middleware passes, and mutating the model adapter directly is
  documented as unsupported (state-management guide). Set `hidden` through the services.
- **A user middleware that writes `hidden`/`groupId`** runs *after* the `hidden-computation`
  middleware, so its change is not re-stamped within the same pass. No built-in middleware
  does this. Candidate fix if it ever matters: re-run the visibility stamp at the tail of the
  chain when hidden-relevant props changed after it.
- **`TemplateVisibilityRegistry` lifetime is tied to `FlowCore`.** Swapping the entire model
  content through the *same* adapter instance (never done by `initializeModel` flows, which
  create a fresh `FlowCore`) keeps the registry, so stale template-hidden entries for reused
  ids could linger. `registry.clear()` exists but currently has no production caller.
  Known leak windows for individual entries (`hidden: true` outliving its declarer): the
  `ngDiagramHidden` directive's destroy skips cleanup while `!flowCore.isInitialized` (a plain
  destroy during the initial init window keeps the entry) and when the owner was already deleted;
  a port removed via `@if` while its node is virtualized-out keeps its entry (self-heals on
  remount only because the port's constructor effect re-writes the current input value, including
  `false`). A later element reusing the id is silently hidden. Candidate fix: clear registry
  entries when their element is removed from the model (e.g. in the hidden-computation pass on
  `anyNodesRemoved`).
- **The directive's replaced-with-same-id guard is vacuous for initial-model nodes.**
  `NgDiagramHiddenDirective` (like the port/label components) guards teardown with an
  `_internalId` comparison, but `_internalId` is only assigned to elements added via
  `nodesToAdd`/`edgesToAdd` — initial-model elements have none (stripped on load), so the guard is
  skipped for them. In practice Angular's create-before-destroy effect ordering masks it; the
  protection just doesn't apply where it claims to.
- **`templateVisibilityChange` passes queue into an in-flight transaction.** A registry write
  raised mid-gesture (drags run inside a transaction) is deferred to commit, so `computedHidden`
  can lag the registry for the duration of the gesture. Not observed to break anything; noted
  because the hidden-inheritance invariant momentarily reflects the pre-toggle state.
- **Directive warning/guard asymmetries.** `OUTSIDE_TEMPLATE_WARNING` is emitted on every toggle
  (not one-shot like the virtualization warning), so a misplaced binding on a busy signal floods
  the console; and `apply()` calls `flowCoreProvider.provide()` unguarded (currently unreachable
  as a throw, but one lifecycle refactor away from an unhandled effect exception).
- **`invalidateMeasurements` counts hidden elements as participants** (they are observed DOM
  elements). Cannot hang — settlement is timer-driven — but a call that touches only hidden
  elements waits one full discovery window (~70 ms) before resolving.

## Documentation drift (actionable doc fixes, not code bugs)

Round 2 found the prose ahead of (or behind) the code in a few places — each is a small doc edit:

- **"Excluded from every interaction surface" is an overclaim**, repeated in the
  conditional-visibility guide, `SimpleNode`/`GroupNode`/`Edge` JSDoc, the `NgDiagramHiddenDirective`
  JSDoc and the CHANGELOG — while this very file documents the programmatic exceptions
  (`select()`, z-order, `centerOnNode`, groups APIs, `rotateNodeTo`, `resizeNode`). Reword to
  "every *interactive* surface" and reference the programmatic-API policy.
- **`SimpleNode.hidden` JSDoc says "stay mounted in the DOM as `display: none`" unqualified** —
  false under virtualization. The guide carries the qualifier; the API reference (generated from
  the type JSDoc) does not.
- **`NgDiagramModelService.computePartsBounds` JSDoc doesn't mention the hidden exclusion** — a
  1.4.0 behavior change for direct callers, currently documented only in the internal helper.
  An all-hidden input returns `{0,0,0,0}`, indistinguishable from "nothing measured yet".
- **`NgDiagramClipboardService.copy()`/`cut()` JSDoc predates the cascade** — it says "copies the
  current selection", but copy now also includes all descendants of selected nodes and the edges
  internal to the copied set.
- **`deleteSelection` vs `deleteNodes` cascade distinction is undrawn** — the guide's "deleting a
  visible group still deletes its hidden children" is true only of `deleteSelection`.
- **`NgDiagramService.startLinking` JSDoc doesn't mention hidden-source behavior** (and its actual
  behavior is currently the open bug #2 in
  [hidden-elements-open-bugs.md](./hidden-elements-open-bugs.md)).

## Test coverage map (for the classes of bug this feature attracted)

| Bug class | Guarded by |
| --- | --- |
| Own-state vs cascade (exclusion at wrong altitude) | `movable-selection.test.ts`, `delete-selection.test.ts`, `copy-paste.test.ts`/`cut.test.ts` hidden describes, drop-on-group e2e |
| Derived-state staleness | `hidden-computation.test.ts`, virtualization visibility-invalidation tests, virtualization unhide e2e |
| Chokepoint bypasses | per-surface exclusion tests (spatial hash, selectAll, box selection, linking, bounds, routing, resolver), keyboard-actions gate spec |
| Lifecycle windows | `ng-diagram-hidden.directive.spec.ts` (replace/reinit/virtualization), port spec virtualized-out case |
| Reactive vs snapshot reads | convention: reactive consumers must read `nodes()`/`edges()` signals, never `getNodeById` inside `computed()` (see the demo toolbar) |
