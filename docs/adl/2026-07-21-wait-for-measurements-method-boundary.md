# waitForMeasurements method boundary

**Date**: 2026-07-21
**Status**: Accepted

## Context

The awaitable-emits change ([2026-07-07](./2026-07-07-awaitable-command-emits.md)) gave
content-creating/updating service methods a per-method
`options?: { waitForMeasurements?: boolean }`. Since then further candidates were evaluated
one by one (`updateNodeData`/`updateEdgeData` and `paste` added; `deleteNodes`/`deleteEdges`,
`addToGroup`/`removeFromGroup`, `rotateNodeTo` refused), each time re-deriving the same
analysis from scratch. This entry records the classification rule and its evidence so a new
method is classified in minutes, not re-litigated.

## Decision

A public service method takes the `waitForMeasurements` option **if and only if the change it
applies can put an element under ResizeObserver** — it creates DOM content or can change an
element's border-box. Everything else must NOT take it.

The reasoning has two halves:

- The base awaitable promise already resolves after the full middleware pass committed —
  including every model-side derivative (group membership, `computedZIndex`, rotated
  `measuredBounds`, edge routing). For a measurement-free mutation, awaiting the method is
  all the sequencing there is to have.
- On a pass that measures nothing, the option cannot resolve early — the `MeasurementTracker`
  waits out its full discovery window (~70 ms) before giving up. It is the one case where
  passing the option makes behavior strictly worse (dead latency plus implied semantics that
  do not exist), which is why API symmetry loses to the boundary.

### The ledger

**With the option** (something can land under ResizeObserver):

- `addNodes`, `addEdges`, `paste` — new DOM content gets created and measured
- `updateNode`, `updateNodes`, `updateNodeData`, `updateEdge`, `updateEdges`,
  `updateEdgeData` — `data`/props can resize a rendered template or edge label
- `resizeNode` — the border-box changes; ports re-measure inside the resized element

**Without the option** (model-only mutations):

- `deleteNodes`, `deleteEdges` — nothing new exists to measure
- `addToGroup`, `removeFromGroup` — membership only
- `rotateNodeTo` — CSS transform; border-box unchanged
- highlight, selection, and viewport operations

### Evidence

1. **Nodes render flat** — one `@for (node of nodes())` in `ng-diagram.component.html`; a
   group's children are never inside the group's DOM element, so NO template can resize a
   group on membership change or child deletion. Confirmed empirically: a default group
   stayed 145×145 before and after deleting its child.
2. **Rotation never fires ResizeObserver** — a CSS transform does not change the border-box.
   Its one derivative, `measuredBounds`, recomputes synchronously in the same pass (the
   measured-bounds middleware's changed-props list includes `angle`).
3. **Deletes settle in one pass** — the node+connected-edges cascade is a single
   `applyUpdate`; a harness experiment showed `await deleteNodes(); zoomToFit()` is
   pixel-identical to the fully settled state. The real delete-then-zoomToFit trap is the
   UN-awaited form: `zoomToFit`'s command body snapshots `getState()` at emit time, before
   the delete pass (holding the update semaphore) commits, and its own `applyUpdate` then
   queues after it — fixed by `await`, not by this option.

## Alternatives considered

- Uniform option on every mutating method (API symmetry) — rejected: converts a no-op into
  guaranteed dead latency and teaches users semantics the pass does not have.
- Making `zoomToFit` order-safe even un-awaited by computing its bounds inside its own pass
  (under the semaphore) — plausible follow-up hardening, out of scope here.
