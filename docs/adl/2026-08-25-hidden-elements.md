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
