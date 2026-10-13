---
name: ng-diagram-troubleshooting
description: Use when something in an ng-diagram app is broken and the cause is unclear - an [ngDiagram] console warning or error, edges not drawn, changes or events that do nothing, timing problems. Triage, console message index, symptom router.
license: Apache-2.0
---

# Troubleshooting ng-diagram

Start from a symptom or a console message: run the first checks, find the symptom below, then open the skill that owns the fix. Every message the library can print is in `references/console-messages.md`; bugs fixed by an upgrade are in `references/upgrade-fixes.md`.

## Rules

- Check the installed version first (`node_modules/ng-diagram/package.json` or the lockfile). Many symptoms are bugs fixed in 1.2–1.4; compare with "Fixed in a later version" below.
- Copy the exact console text and search `references/console-messages.md` for it. Most library messages start with `[ngDiagram]`; for a multi-line message, search its first line.
- Go through "First checks" before deep debugging. Most reports are one of them.
- Confirm every API name in `node_modules/ng-diagram/ng-diagram.d.ts` before you suggest code. Some docs pages and older examples do not compile against 1.4.0.
- Never "fix" by writing system-owned fields (`measuredPorts`, `measuredBounds`, `measuredLabels`, `computedZIndex`, `computedHidden`, `sourcePosition`/`targetPosition` of connected ends, `points` of auto-routed edges, `size` of auto-sized nodes). The library recomputes them and your value is lost.
- Never hide nodes, edges, ports or the diagram with CSS `display: none`. Hidden elements measure 0 × 0, initialization waits 2 to 4 seconds and logs measurement timeouts. Use the `hidden` flag or inputs (`ng-diagram-visibility`).

## First checks

Check these in order; each line says how to see it quickly.

1. **Global styles.** `getComputedStyle(document.documentElement).getPropertyValue('--ngd-node-border-radius')` is empty when `ng-diagram/styles.css` is not imported in the global stylesheet. → `ng-diagram-setup`
2. **`provideNgDiagram()` scope.** It must be in `providers` of the component that renders `<ng-diagram>` (or an ancestor), and every component or service that injects an ng-diagram service must sit below it. Otherwise: `NgDiagram services are not available…` or `NG0201` / `NullInjectorError`. → `ng-diagram-setup`
3. **Container size.** `<ng-diagram>` is 100% of its parent; a parent without a height shows nothing and logs nothing. Look at the element's height in DevTools. → `ng-diagram-setup`
4. **One model per diagram.** Create it once with `initializeModel()` (custom adapters: `initializeModelAdapter()`). Re-creating it re-initializes the diagram; binding a model again after its diagram was destroyed gives an empty, frozen diagram. → `ng-diagram-model-init`, `ng-diagram-persistence`
5. **No calls before init.** Service calls in the host's constructor or `ngOnInit`, or a toolbar that binds `canZoomIn()`, throw `[ngDiagram] Library engine not initialized yet.` Move them into `(diagramInit)` or guard with `isInitialized()`. → `ng-diagram-model-init`
6. **Runtime config.** `<ng-diagram>` reads `[config]` (except the watermark keys) and `[middlewares]` only when a model is initialized. At runtime use `NgDiagramService.updateConfig()` and `registerMiddleware()`; a few keys are read only at engine start even then (`ng-diagram-config`).
7. **Await, then read with getters.** After `await` on a service call, `getNodeById()`, `getEdgeById()` and `getModel()` are fresh; the `nodes()` / `edges()` / `metadata()` signals refresh with change detection and can lag, also in event handlers. → `ng-diagram-state-updates`
8. **Nothing hidden with CSS.** `display: none` on nodes, ports, labels or a parent of the diagram (an inactive tab, a collapsed panel) shows as `Measurement timeout reached` warnings and a diagram that appears after 2 to 4 seconds. → `ng-diagram-visibility`
9. **Port ids.** `sourcePort` / `targetPort` must name a port that the node template renders (the default node has `port-left` and `port-right`). A wrong id draws nothing and logs nothing; compare with `getNodeById(id)?.measuredPorts?.map((p) => p.id)`. → `ng-diagram-ports`
10. **Only the background goes inside `<ng-diagram>`.** It projects `<ng-diagram-background>` and nothing else; a minimap, toolbar or overlay placed inside is not rendered. Put them next to it in a `position: relative` wrapper. → `ng-diagram-setup`, `ng-diagram-minimap`

## Symptom router

The owning skill has the full table for its area.

### Setup and rendering

| Symptom | Likely cause | Skill |
| --- | --- | --- |
| Empty area, nothing visible, no error | Parent of `<ng-diagram>` has no height | `ng-diagram-setup` |
| Unstyled boxes, CSS variables do nothing | `styles.css` missing or imported in a component | `ng-diagram-setup`, `ng-diagram-styling` |
| ``NgDiagram services are not available. Please register all required services using `provideNgDiagram()` …`` | No `provideNgDiagram()` above `<ng-diagram>` | `ng-diagram-setup` |
| `NullInjectorError` / `NG0201` for an ng-diagram service in a toolbar, sidebar, palette or minimap | That code is outside the `provideNgDiagram()` tree | `ng-diagram-setup` |
| Two diagrams interfere, or one turns empty | Both share one `provideNgDiagram()` | `ng-diagram-setup` |
| `[ngDiagram] Node template '<type>' is not registered…` | `type` does not match a key of `[nodeTemplateMap]` | `ng-diagram-custom-nodes` |
| `[ngDiagram] Edge template '<type>' is not registered…` | `type` does not match a key of `[edgeTemplateMap]` | `ng-diagram-custom-edges` |

### Initialization and timing

| Symptom | Likely cause | Skill |
| --- | --- | --- |
| `[ngDiagram] Library engine not initialized yet.` | Service call before `<ng-diagram>` created its engine, or after it was destroyed | `ng-diagram-model-init` |
| Diagram appears after 2 to 4 s; `[InitUpdater]` / `[DiagramInitEmitter] Measurement timeout reached` | Elements or a container hidden with CSS at load, or model not from `initializeModel()` | `ng-diagram-model-init`, `ng-diagram-visibility` |
| `NG0203` `effect() can only be used within an injection context` from `initializeModel` | Called after `await`, in a handler or in `computed`; pass the injector | `ng-diagram-model-init` |
| `(diagramInit)` does not fire after "reloading" | Same model object bound again, or events disabled before init | `ng-diagram-model-init` |
| Diagram empty or frozen after an `@if`, tab or route brings it back | Its model was destroyed with the old diagram | `ng-diagram-model-init` |
| Nodes added right after loading a new model disappear | They went to the old model; add them in `(diagramInit)` | `ng-diagram-model-init` |
| Middlewares, routings, listeners or `updateConfig` changes gone after loading another model | A new model means a new engine; re-apply after `(diagramInit)` | `ng-diagram-model-init`, `ng-diagram-config` |
| Changing the object bound to `[config]` does nothing | Read only at model init; use `updateConfig()` | `ng-diagram-config` |

### Model updates and state

| Symptom | Likely cause | Skill |
| --- | --- | --- |
| `nodes()` / `selection()` shows old data after `await` or in an event handler | Signals refresh with change detection; use getters or the event payload | `ng-diagram-state-updates` |
| Other `data` fields disappear after `updateNodeData` | `data` is replaced, not merged | `ng-diagram-state-updates` |
| An update does nothing | Same mutated object passed back, unknown id, or a middleware cancelled it | `ng-diagram-state-updates` |
| `await` on a service call never resolves; the diagram stops changing | A middleware never calls `next()`/`cancel()` or awaits a mutating call | `ng-diagram-middleware` |
| `Middleware <name> already registered` / `executed next() multiple times` | Name registered twice / `next()` called on two paths | `ng-diagram-middleware` |
| `A nested transaction outlived its parent…` / `waitForMeasurements is ignored…` | Un-awaited overlapping transactions / option inside a transaction | `ng-diagram-transactions` |
| Group children gone after `deleteNodes([groupId])` | Expected since 1.4.0; `removeFromGroup` first | `ng-diagram-groups` |
| Ctrl/Cmd+Z logs `Undo is not implemented in the current model…` | The default model has no history | `ng-diagram-persistence` |

### Nodes, ports and measurement

| Symptom | Likely cause | Skill |
| --- | --- | --- |
| Cannot draw an edge from or to a node | No `<ng-diagram-port>`, wrong port `type`, or the port is hidden | `ng-diagram-ports` |
| Port positions stale after a class toggle or style change | CSS-only moves are not observed; `await invalidateMeasurements()` | `ng-diagram-ports` |
| `size` ignored or overwritten | `autoSize` is `true`; set `autoSize: false` | `ng-diagram-custom-nodes` |
| Typing in an input inside a node drags the node or pans | Add `data-no-drag="true"` / `data-no-pan="true"` | `ng-diagram-custom-nodes` |
| Selection highlight invisible on a custom node | Host is `display: inline` | `ng-diagram-custom-nodes`, `ng-diagram-styling` |
| No resize or rotate handles | Adornment missing, node not selected or rotated, or disabled | `ng-diagram-resize-rotate-snap` |
| Snapping does nothing | The `shouldSnap…` callbacks return `false` by default | `ng-diagram-resize-rotate-snap` |
| A node does not join a group on drop | Group lacks `isGroup: true`, or `canGroup` returned `false` | `ng-diagram-groups` |

### Edges and linking

| Symptom | Likely cause | Skill |
| --- | --- | --- |
| Edge not drawn, no error | Wrong port id, port not measured, manual edge without `points`, or hidden | `ng-diagram-edge-routing` |
| `[ngDiagram] Invalid edge coordinates detected for edge '<id>'` | Missing node, free end without position, or invalid `points` | `ng-diagram-edge-routing`, `ng-diagram-dangling-edges` |
| `[ngDiagram] Edge routing '<name>' is not registered…` | Routing registered too late or misspelled | `ng-diagram-edge-routing` |
| Edges hidden behind nodes | Default z-order; `zIndex.edgesAboveConnectedNodes: true` | `ng-diagram-layering` |
| Drawn edges use the default template or routing | Set `type` / `routing` in `finalEdgeDataBuilder` | `ng-diagram-linking` |
| Pressing a port starts no draw | Target-only or hidden port, or another draw or relink runs | `ng-diagram-linking` |
| Edges created twice after enabling dangling edges | An `edgeDrawEnded` handler adds an edge on `noTarget` | `ng-diagram-dangling-edges` |
| No relink handles on a selected edge, or a node covers them | Not relinkable, no routed path yet, or `zIndex` elevation turned off | `ng-diagram-edge-relinking` |
| `event.source.id` fails to compile after upgrading to 1.4.0 | `EdgeDrawEndedEvent.source` is optional | `ng-diagram-linking` |

### Interaction and events

| Symptom | Likely cause | Skill |
| --- | --- | --- |
| No keyboard shortcut works | Focus is outside the diagram | `ng-diagram-shortcuts` |
| All default shortcuts gone after customizing | `shortcuts` replaced as a plain array; use `configureShortcuts()` | `ng-diagram-shortcuts` |
| `(output)` handlers stopped firing | `removeAllEventListeners()` or events disabled | `ng-diagram-events` |
| `[ngDiagram] Event listener error: Listener for "<event>"…` | Your `addEventListener` callback threw | `ng-diagram-events` |
| `selectionRemoved` never fires for a delete button | It fires only for the Delete/Backspace key, `deleteSelection()` and `cut()` | `ng-diagram-events` |
| Toolbar opens on mouse down or flickers | Use `selectionGestureEnded`, not `selectionChanged` | `ng-diagram-events` |
| Browser menu appears over a custom context menu | `preventDefault()` ran after an `await` | `ng-diagram-selection-clipboard` |
| Box selection does nothing on a tablet | Hold still for 400 ms, then drag | `ng-diagram-touch` |
| `[ngDiagram] Invalid drop data…` or a node created from a file drop | Something that is not a palette item was dropped | `ng-diagram-palette` |

### Viewport and export

| Symptom | Likely cause | Skill |
| --- | --- | --- |
| `zoomToFit()` ignores new nodes or fits the old content | Not measured or not awaited; use `{ waitForMeasurements: true }` | `ng-diagram-viewport` |
| `[ngDiagram] zoomToFit is disabled when virtualization is enabled.` | Expected; use a custom fit | `ng-diagram-viewport` |
| `Zoom scale … is out of bounds […]`, zoom button stops early | `zoom()` does not clamp; use `setViewport()` | `ng-diagram-viewport` |
| Drop, paste or new node lands in the wrong place | Raw client coordinates; convert with `clientToFlowPosition` | `ng-diagram-viewport` |
| Exported image is blank or misses parts | Exported before `diagramInit`, or virtualization | `ng-diagram-export` |

### Performance

| Symptom | Likely cause | Skill |
| --- | --- | --- |
| Every data change re-measures and fires `diagramInit` | The model is re-created; keep one model and use services | `ng-diagram-performance` |
| Bulk import or layout apply is slow | One call per element; batch with arrays or a transaction | `ng-diagram-performance` |
| Lag while dragging | Heavy templates or middlewares run every frame | `ng-diagram-performance` |
| Console flooded with `[ngDiagram]` logs | `debugMode: true` | `ng-diagram-config` |
| Minimap slows down drags | Set `[deferNodeUpdates]="true"` | `ng-diagram-minimap` |

### Styling and layering

| Symptom | Likely cause | Skill |
| --- | --- | --- |
| Dark theme does not apply, or an override works in light mode only | `data-theme` not on `<html>`, or no `html[data-theme='dark']` block | `ng-diagram-styling` |
| `--ngd-node-background-color` changes nothing | No template reads it; use `--ngd-node-bg-primary-default` | `ng-diagram-styling` |
| `bringToFront()` does nothing | No selection and no ids, an empty array, or `zIndex.enabled: false` | `ng-diagram-layering` |
| A dropdown inside a node is covered by the next node | Each node is a stacking context | `ng-diagram-layering` |
| Minimap invisible, or empty with virtualization | Placed inside `<ng-diagram>`; no nodes is by design with virtualization | `ng-diagram-minimap` |

## Silent failures

These produce no console message:

- An edge whose `sourcePort` / `targetPort` the node does not render is not drawn (`ng-diagram-ports`).
- An edge with `routingMode: 'manual'` and no `points` is not drawn (`ng-diagram-edge-routing`).
- When a port is removed (for example with `@if`) while edges still name it, those edges keep their last path and stop following the node (`ng-diagram-ports`).
- An edge whose port was `[hidden]` from its first render is not drawn: the port was never measured. Show ports during initialization and hide them in `(diagramInit)` (`ng-diagram-ports`).
- New values in `[config]` (except `hideWatermark` / `watermarkPosition`) or `[middlewares]` after init are ignored (`ng-diagram-config`, `ng-diagram-middleware`).
- A model bound again after its diagram was destroyed shows an empty, frozen diagram (`ng-diagram-model-init`).
- Content inside `<ng-diagram>` other than `<ng-diagram-background>` is not rendered (`ng-diagram-setup`).
- An update that passes back the same mutated object, or names an unknown id, changes nothing; `addNodes` with an existing id replaces that node (`ng-diagram-state-updates`).
- A middleware path without `next()` or `cancel()` leaves the update pending forever; `cancel()` resolves the caller's promise normally (`ng-diagram-middleware`).
- `selectionRemoved` fires only for the Delete/Backspace key, `deleteSelection()` and `cut()`, not `deleteNodes` / `deleteEdges`; `groupMembershipChanged` does not fire for a single `updateNode(id, { groupId })` (use `updateNodes` or `NgDiagramGroupsService`); `nodeResized` does not fire for `updateNode(id, { size })` (`ng-diagram-events`).
- `bringToFront([])` / `sendToBack([])` change nothing; an empty array replaces the selection (`ng-diagram-layering`).

## Diagnostic tools

- **`debugMode: true`** (in `[config]`, or at runtime `NgDiagramService.updateConfig({ debugMode: true })`) logs every update that runs the middleware chain as `[ngDiagram] <action types>` with `{ initialState, finalState, history, initialUpdate }` (viewport moves during a pan skip the chain and are not logged); `history` lists each middleware that passed an update to `next()`. Renders that add or remove nodes log `[ngDiagram] Render: +<added> -<removed> nodes (total: <n>): <ms>ms`. Turn it off on large diagrams.
- **`NgDiagramService.isInitialized()`** turns `true` after the current model's `diagramInit`. **`config()`** shows the effective config (`{}` before init). **`actionState()`** shows the running gesture (`dragging`, `resize`, `rotation`, `linking`, `panning`, `selection`, `copyPaste`, `highlightGroup`).
- **Fresh reads:** `NgDiagramModelService.getNodeById()`, `getEdgeById()`, `getModel().getNodes()`, and `toJSON()` for a snapshot to compare or attach to a report.
- **DOM:** node wrappers are `<ng-diagram-node data-node-id="…">`, edges `<ng-diagram-edge data-edge-id="…">`; hidden ones carry an inline `display: none`, and the inline `z-index` on the node wrapper and on `<ng-diagram-base-edge>` is the computed z-order.
- **`NgDiagramService.getEnvironment()`** reports the detected `os` and `browser`; on `os: 'MacOS'` the `primary` shortcut modifier is Cmd, elsewhere Ctrl.
- **Lookups:** `references/console-messages.md` for console text; the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) for API pages.

## Fixed in a later version

The most common ones; read `references/upgrade-fixes.md` for every fix from 1.2.0 to 1.4.0.

| Symptom | Fixed in |
| --- | --- |
| The diagram stops applying any change after an error in a middleware | 1.3.0 |
| Updates from overlapping un-awaited transactions are lost; `await transaction(syncFn)` does not wait | 1.3.0 |
| Saved dangling edges lose their free ends, `Invalid edge coordinates detected` on load | 1.3.0 |
| Ports stay at old positions with `Node measurement failed: Node element not found.` (diagram inside `ngTemplateOutlet`, a portal or an overlay) | 1.4.0 |
| Node, port or label geometry becomes 0 × 0 after hiding with CSS | 1.4.0 |
| `deleteNodes` on a group leaves children pointing at a deleted group; a pasted group is empty | 1.4.0 |
| `zoomToFit({ nodeIds })` shows the whole diagram; minimap or bounds stretched to (0, 0) | 1.4.0 |
| Children render under their group | 1.2.3 |
| Inputs inside nodes do not respond on iPhone or iPad | 1.2.2 |
| After pressing a target-only port, no edge can be drawn any more | 1.2.1 |

## Reporting a bug

Messages in the "Internal" section of `references/console-messages.md` are always worth a report. Include:

- The versions of ng-diagram, Angular and TypeScript (ng-diagram needs Angular 18+ and TypeScript 5.6+), and the browser and OS (`getEnvironment()`).
- The exact console output: the full message and its stack trace.
- A minimal reproduction: the smallest model (`toJSON()` output), config and templates that show the problem, and what you expected instead.

Report bugs at https://github.com/synergycodes/ng-diagram/issues. Ask questions in https://github.com/synergycodes/ng-diagram/discussions or on Discord: https://discord.gg/FDMjRuarFb.

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
