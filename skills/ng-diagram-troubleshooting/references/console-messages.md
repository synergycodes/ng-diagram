# ng-diagram console messages and errors (1.4.0)

Every message ng-diagram 1.4.0 can print or throw that an app developer can trigger, with the cause and the fix. Search this file for the text you see; most messages start with `[ngDiagram]`. Multi-line messages are listed by their first line.

Each entry: level (`warn`, `error`, `throw`, `log`), source location, owning skill, then when it fires and how to fix it. Source paths are relative to `packages/ng-diagram/projects/ng-diagram/src/` in https://github.com/synergycodes/ng-diagram (tag `v1.4.0`); the installed package contains the same code in `fesm2022/ng-diagram.mjs`.

## Contents

- [Setup and initialization](#setup-and-initialization)
- [Model, services and transactions](#model-services-and-transactions)
- [Middleware and events](#middleware-and-events)
- [Nodes, groups, ports and measurement](#nodes-groups-ports-and-measurement)
- [Edges, routing, linking, relinking and dangling edges](#edges-routing-linking-relinking-and-dangling-edges)
- [Viewport](#viewport)
- [Palette](#palette)
- [Visibility](#visibility)
- [Undo and redo](#undo-and-redo)
- [Debug output](#debug-output)
- [Errors without the ngDiagram prefix](#errors-without-the-ngdiagram-prefix)
- [No message at all](#no-message-at-all)
- [Messages from older versions](#messages-from-older-versions)
- [Internal: report a bug](#internal-report-a-bug)

## Setup and initialization

### ``NgDiagram services are not available. Please register all required services using `provideNgDiagram()` in your component's providers array.``
`throw` · `lib/directives/services-availability-checker/ng-diagram-services-availability-checker.directive.ts:13` · `ng-diagram-setup`
- When: `<ng-diagram>` is created and no parent injector provides the ng-diagram services.
- Fix: add `providers: [provideNgDiagram()]` to the component whose template contains `<ng-diagram>` (or to a parent of it).

### `[ngDiagram] Library engine not initialized yet.`
`throw` · `lib/services/flow-core-provider/flow-core-provider.service.ts:55` · `ng-diagram-model-init`
- When: a method of an ng-diagram service (`NgDiagramService`, `NgDiagramModelService`, `NgDiagramNodeService`, ...) needs the engine before `<ng-diagram>` has set it up (for example in the constructor or `ngOnInit` of the host component), or after `<ng-diagram>` was destroyed (an `@if`, a route change). `NgDiagramViewportService.canZoomIn()`, `canZoomOut()`, `minZoom` and `maxZoom` also read the engine, so a toolbar that binds them before init throws this too.
- Fix: call it after the `(diagramInit)` event or when `NgDiagramService.isInitialized()` is true, and stop calling it once the diagram is gone. `NgDiagramModelService.nodes()` / `edges()` / `metadata()` and `NgDiagramViewportService.viewport()` / `scale()` are safe to read before init.

### `[InitUpdater] Measurement timeout reached. Some entities may not be measurable (e.g., display: none).`
`warn` · `core/src/updater/init-updater/init-updater.ts:340` · `ng-diagram-model-init`
- When: 2 seconds after the initial nodes, ports and labels were registered, some of them still have no valid size or position. Initialization then finishes without them. The object after the text shows `expected` and `measured` counts for nodes, ports and labels.
- Cause: elements hidden with CSS `display: none` (they measure 0 × 0, which the library ignores), `<ng-diagram>` inside a container that is hidden at load (inactive tab, collapsed panel, dialog not open yet), or a model not created with `initializeModel()` / `initializeModelAdapter()`.
- Fix: hide with the `hidden` flag on nodes and edges or the `hidden` input on ports and labels (see `ng-diagram-visibility`); create the diagram, with a new model, only when its container is visible (for example with `@if`; see `ng-diagram-model-init`); always pass the model through `initializeModel()` or `initializeModelAdapter()`.

### `[DiagramInitEmitter] Measurement timeout reached from last measurement. Emitting diagramInit event anyway.`
`warn` · `core/src/middleware-manager/middlewares/event-emitter/emitters/diagram-init.emitter.ts:227` · `ng-diagram-model-init`
- Followed by `Total unmeasured elements: <n>` and, when not empty, `Unmeasured nodes (<n>):`, `Unmeasured node ports (<n>):` (entries `nodeId:portId`) and `Unmeasured edge labels (<n>):` (entries `edgeId:labelId`) (lines 232-243).
- When: after initialization, a visible node, port or label still has no valid measurement and nothing new was measured for 2 seconds. `diagramInit` fires anyway.
- Fix: the lists name the elements. Same causes and fixes as the `[InitUpdater]` warning above.

### `[ngDiagram] Initialization completion failed — continuing initialization.`
`error` · `core/src/updater/init-updater/init-updater.ts:308` · `ng-diagram-model-init`, `ng-diagram-middleware`
- When: the initial model update failed, for example a custom `ModelAdapter` or a middleware threw during the `init` pass. The error object is printed after the text. Initialization still completes (since 1.3.0).
- Fix: fix the adapter or middleware named in the stack trace.

### `[ngDiagram] Node template '<type>' is not registered. Falling back to default node template.`
`warn`, once per type until the template map changes · `lib/services/template-provider/template-provider.service.ts:45` · `ng-diagram-custom-nodes`
- When: a node has a `type` with no entry in `[nodeTemplateMap]`. A group (`isGroup: true`) falls back to the default group template.
- Fix: register the type (`new NgDiagramNodeTemplateMap([['my-type', MyNodeComponent]])` bound to `[nodeTemplateMap]`), fix the spelling, or remove `type` if you want the default node.

### `[ngDiagram] Edge template '<type>' is not registered. Falling back to default edge template.`
`warn`, once per type until the template map changes · `lib/services/template-provider/template-provider.service.ts:60` · `ng-diagram-custom-edges`
- When: an edge has a `type` with no entry in `[edgeTemplateMap]`.
- Fix: register it in an `NgDiagramEdgeTemplateMap` bound to `[edgeTemplateMap]`, or fix the spelling.

## Model, services and transactions

### `[ngDiagram] waitForMeasurements is ignored inside a transaction — pass { waitForMeasurements: true } to the transaction itself instead.`
`warn` · `lib/public-services/emit-with-measurement-option.ts:40` · `ng-diagram-transactions`
- When: a service method is called with `{ waitForMeasurements: true }` inside a `transaction()` callback (since 1.3.0). The change is applied; only the option is dropped.
- Fix: `await diagram.transaction(() => { ... }, { waitForMeasurements: true })`.

### `[ngDiagram] waitForMeasurements is ignored on a nested transaction — its updates are applied (and measured) only when the root transaction commits. Pass the option to the root transaction instead.`
`warn` · `core/src/flow-core.ts:355` · `ng-diagram-transactions`
- When: `transaction(cb, { waitForMeasurements: true })` starts while another transaction is running.
- Fix: put the option on the outermost transaction.

### `[ngDiagram] A nested transaction outlived its parent transaction — committing its updates independently. Await transactions instead of running them fire-and-forget.`
`warn` · `core/src/transaction-manager/transaction-manager.ts:55` · `ng-diagram-transactions`
- When: a transaction started while another was still running (so it became nested), and the outer one finished first. Typical for async transactions started one after another without `await`. Its updates are still applied (since 1.3.0; before, they were lost).
- Fix: `await` each transaction before starting the next.

### `[ngDiagram] cancelActiveInteraction() called while a transaction is active — ignored.`
`warn` · `core/src/interaction-coordinator/interaction-coordinator.ts:57` · `ng-diagram-shortcuts`
- When: `NgDiagramService.cancelActiveInteraction()` (also the Escape key through the `cancelInteraction` shortcut) runs while a transaction is active. It returns `false` and cancels nothing.
- Fix: await the transaction, then cancel.

### `[ngDiagram] Model integrity error: Node references non-existent parent.`
`error` · `core/src/model-lookup/model-lookup.ts:451` · `ng-diagram-groups`
- When: `NgDiagramModelService.getParentHierarchy(nodeId)` follows a `groupId` that points to a node that is not in the model. It returns the chain found so far.
- Cause: model data with a stale `groupId`; before 1.4.0, `deleteNodes` on a group left its children with such a `groupId`.
- Fix: clear the stale `groupId`, for example `await modelService.updateNode(childId, { groupId: undefined })` (`updateNodes` for many). `NgDiagramGroupsService.removeFromGroup` does nothing here, because the group no longer exists. Upgrade to 1.4.0 so that `deleteNodes` no longer leaves such children.

### `[ngDiagram] Model integrity error: Node's parent is not a group.`
`error` · `core/src/model-lookup/model-lookup.ts:456` · `ng-diagram-groups`
- When: `getParentHierarchy` reaches a `groupId` that points to a node without `isGroup: true`.
- Fix: set `isGroup: true` on the parent, or correct the `groupId`.

## Middleware and events

### `Middleware <name> already registered`
`throw` · `core/src/middleware-manager/middleware-manager.ts:41` · `ng-diagram-middleware`
- When: `NgDiagramService.registerMiddleware()` gets a name that is already in the chain, or the `[middlewares]` chain contains a name twice (thrown when the model is initialized). Built-in names: `internal-id-assignment`, `z-index`, `edges-routing`.
- Fix: use unique names; keep the function returned by `registerMiddleware` and call it before you register again (for example in `ngOnDestroy`); do not register in an `effect` that runs more than once.

### `[ngDiagram] Error: Middleware <name> executed next() multiple times`
`error` (an `Error` logged after the `[ngDiagram]` prefix) · `core/src/middleware-manager/middleware-executor.ts:174`, logged at `core/src/middleware-manager/pass-settlement.ts:86` · `ng-diagram-middleware`
- When: a middleware calls `next()` more than once in one run. The second call returns a rejected promise.
- Fix: call `next()` exactly once, or `cancel()` instead, on every code path.

### `[ngDiagram]` followed by your own error
`error` · `core/src/middleware-manager/pass-settlement.ts:86` · `ng-diagram-middleware`
- When: a middleware failed after its update pass had already finished, for example an async middleware that throws or rejects after it called `next()` or `cancel()`.
- Fix: settle each run once, and catch errors in the async part of the middleware.

### Your own error from a middleware, adapter or callback
no ngDiagram text · `ng-diagram-middleware`
- Since 1.3.0 a throwing middleware rejects the promise of the call that started the update, so `await modelService.addNodes(...)` throws your error and the diagram keeps working. `cancelActiveInteraction()` rethrows the first error raised while cancelling (`core/src/interaction-coordinator/interaction-coordinator.ts:89`).
- Updates that nothing awaits (user gestures, measurements) can surface the same error as an unhandled promise rejection, or through `[ngDiagram] BatchProcessor flush callback failed.` (below), `[ngDiagram] Failed to apply template visibility change.` (Visibility) or `[ngDiagram] Initialization completion failed` (Setup).
- Fix: fix the middleware; check `context.modelActionTypes` before you change an update.

### `[ngDiagram] BatchProcessor flush callback failed.`
`error` · `core/src/batch-processor/batch-processor.ts:126` · `ng-diagram-middleware`
- When: applying a batch of measured port or edge-label changes failed; the error follows the text. This update runs through the middleware chain, so a throwing custom middleware is the usual cause. The other batches are still applied.
- Fix: fix the middleware named in the stack trace.

### `[ngDiagram] Event listener error: Listener for "<event>" event threw an error.`
`error` · `core/src/event-manager/event-manager.ts:107` · `ng-diagram-events`
- When: a callback registered with `NgDiagramService.addEventListener()` or `addEventListenerOnce()` threw. The diagram continues. A throwing `addEventListenerOnce` callback stays registered, because it is removed only after a successful call.
- Errors in template `(output)` handlers on `<ng-diagram>` do not produce this message; Angular reports them through its `ErrorHandler`.
- Fix: fix or guard the callback.

## Nodes, groups, ports and measurement

### `[ngDiagram] Resize node failed: Node not found.`
`error` · `core/src/command-handler/commands/resize-node.ts:106` · `ng-diagram-resize-rotate-snap`
- When: `NgDiagramNodeService.resizeNode(id, ...)` with an id that is not in the model (deleted, or a typo). Nothing changes.
- Fix: check the id with `getNodeById` first.

### `Group must have both width and height defined`
`throw` · `core/src/utils/group-size.ts:16` · `ng-diagram-groups`
- When: a group with visible children is resized (by the user or `resizeNode`) while its `size` has a width or height of 0. The returned promise rejects.
- Fix: give groups a positive `size`.

### `calculateGroupBounds: child node <id> does not have both width and height defined`
`throw` · `core/src/utils/group-size.ts:33` · `ng-diagram-groups`
- When: with `resize.allowResizeBelowChildrenBounds: false`, a group is resized while a visible child has a `size` with a width or height of 0.
- Fix: give child nodes a positive `size`.

### `[ngDiagram] Port measurement failed: Missing data-port-id attribute.`
`error` · `lib/services/update-ports/update-ports.service.ts:54` · `ng-diagram-ports`
- When: inside a node, an element has an empty `data-port-id` attribute: an `<ng-diagram-port>` with an empty `id`, or your own element with `data-port-id=""`. That port is skipped.
- Fix: give every port a non-empty id that is unique within its node.

### `[ngDiagram] Port measurement failed: Parent node not found.`
`error` · `lib/services/update-ports/update-ports.service.ts:38` · `ng-diagram-ports`
- When: a port being measured is no longer inside a node element. Usually a short-lived message while nodes are removed or re-rendered.
- Fix: none needed if it happens only during removal. If it repeats, make sure the port is rendered inside a node template.

## Edges, routing, linking, relinking and dangling edges

### `[ngDiagram] Invalid edge coordinates detected for edge '<id>'.`
`error` · `core/src/middleware-manager/middlewares/edges-routing/get-edge-points.ts:140` and `lib/components/edge/base-edge/base-edge.component.ts:143` · `ng-diagram-edge-routing`, `ng-diagram-dangling-edges`
- When (routing): an end of the edge cannot be placed. Its `source` / `target` names a node that is not in the model and no port is given, or a free end (`source` / `target` is `''`) has no `sourcePosition` / `targetPosition`.
- When (rendering): the edge `points` contain `NaN`, `null` or `undefined` coordinates, for example manual-routing `points` with bad values, or a custom routing that returns invalid points.
- The edge is not drawn. The text lists the edge's source, target and ports.
- Fix: correct the node ids, give free ends a position, return valid points. Before 1.3.0 this also fired for valid dangling edges loaded from saved data; upgrade.

### `[ngDiagram] Edge routing '<name>' is not registered. Falling back to default routing.`
`warn`, on every routing pass · `core/src/middleware-manager/middlewares/edges-routing/get-edge-points.ts:109` · `ng-diagram-edge-routing`
- When: an edge has `routing: '<name>'` and no routing with that name is registered. Built-in names: `orthogonal`, `bezier`, `polyline`.
- Fix: register custom routings with `NgDiagramService.registerRouting()` before edges use them, or fix the name.

### `[ngDiagram] Routing '<name>' is not registered. Falling back to '<default>' routing.`
`warn` · `core/src/edge-routing-manager/edge-routing-manager.ts:180`, `211`, `250`, `289` · `ng-diagram-edge-routing`
- When: a point or path is computed with an unregistered routing name, for example the label position of an edge whose `routing` is not registered, or your own code calling the routing manager. The text lists the available routings.
- Fix: as above.

### `[ngDiagram] Cannot set default routing to '<name>': routing not registered. Default routing unchanged.`
`warn` · `core/src/edge-routing-manager/edge-routing-manager.ts:307` · `ng-diagram-edge-routing`
- When: `NgDiagramService.setDefaultRouting(name)` before that routing is registered.
- Fix: call `registerRouting()` first.

### `[ngDiagram] Routing must have a non-empty name property. Registration skipped.`
`warn` · `core/src/edge-routing-manager/edge-routing-manager.ts:112` · `ng-diagram-edge-routing`
- When: `registerRouting(routing)` with an empty or missing `name`.
- Fix: give the routing object a `name`.

### `[ngDiagram] Marker element not found in projected content`
`warn` · `lib/components/marker/ng-diagram-marker.component.ts:68` · `ng-diagram-custom-edges`
- When: `<ng-diagram-marker>` contains no `<marker>` element after its view is created.
- Fix: put `<svg><defs><marker id="...">...</marker></defs></svg>` directly inside `<ng-diagram-marker>`.

### `[ngDiagram] Marker element must have an id attribute`
`warn` · `lib/components/marker/ng-diagram-marker.component.ts:74` · `ng-diagram-custom-edges`
- When: the `<marker>` inside `<ng-diagram-marker>` has no `id`. Edges refer to markers by id (`sourceArrowhead`, `targetArrowhead`).
- Fix: add an `id`.

### `[ngDiagram] startLinking ignored: another linking or relinking gesture is in progress.`
`warn` · `core/src/input-events/handlers/linking/linking.handler.ts:37` (port press) and `lib/services/input-events/manual-linking.service.ts:30` (`NgDiagramService.startLinking`) · `ng-diagram-linking`
- When: a draw is started while an edge is already being drawn or relinked, for example `startLinking()` called twice, or a port pressed during a draw started from code.
- Fix: wait for `edgeDrawEnded` / `edgeRelinkEnded`, or call `cancelActiveInteraction()` first.

### `[ngDiagram] startLinking ignored: source node "<id>" is missing or effectively hidden.`
`warn` · `lib/services/input-events/manual-linking.service.ts:35` · `ng-diagram-linking`
- When: `NgDiagramService.startLinking(node, portId)` with a node that is not in the model or is hidden (`computedHidden`, since 1.4.0).
- Fix: pass a current, visible node, for example from `getNodeById`.

### `[ngDiagram] startLinking ignored: source node "<id>" is effectively hidden.`
`warn` · `core/src/command-handler/commands/linking/start-linking.ts:33` · `ng-diagram-linking`
- When: a draw starts from a node that is hidden at that moment (since 1.4.0). Nothing is drawn.
- Fix: do not start draws from hidden nodes; show the node first.

### `[ngDiagram] startLinkingFromPosition ignored: dangling edges are disabled.`
`warn` · `lib/services/input-events/manual-linking.service.ts:75` · `ng-diagram-dangling-edges`
- When: `NgDiagramService.startLinkingFromPosition()` (since 1.4.0) while `danglingEdges.enabled` is not `true`.
- Fix: set `danglingEdges: { enabled: true }` in the config.

### `[ngDiagram] startLinkingFromPosition ignored: another linking or relinking gesture is in progress.`
`warn` · `lib/services/input-events/manual-linking.service.ts:82` · `ng-diagram-dangling-edges`
- When: called while a draw or relink is running.
- Fix: wait for it to end, or cancel it first.

### `[ngDiagram] detachEdge ignored: dangling edges are disabled.`
`warn` · `lib/public-services/ng-diagram-model.service.ts:220` · `ng-diagram-dangling-edges`
- When: `NgDiagramModelService.detachEdge()` (since 1.4.0) while `danglingEdges.enabled` is not `true`. The promise resolves without a change.
- Fix: enable `danglingEdges`.

## Viewport

### `[ngDiagram] zoomToFit is disabled when virtualization is enabled.`
`warn` · `core/src/command-handler/commands/zoom-to-fit.ts:122` · `ng-diagram-viewport`, `ng-diagram-performance`
- When: `zoomToFit()` is called, or `zoom.zoomToFit.onInit` is `true`, with `virtualization.enabled`.
- Fix: turn virtualization off, or position the view yourself with `NgDiagramViewportService.setViewport()`.

### `Zoom scale <scale> is out of bounds [<min>, <max>]`
`warn` (no prefix) · `core/src/command-handler/commands/zoom.ts:28` · `ng-diagram-viewport`
- When: `NgDiagramViewportService.zoom(factor)` would leave `zoom.min` / `zoom.max` (defaults `0.01` / `10`). The viewport does not change at all; there is no clamping.
- Fix: limit the factor yourself, disable your buttons with `canZoomIn()` / `canZoomOut()` (read them only after init), or use `setViewport()`, which clamps.

### `[ngDiagram] setViewport: scale <scale> is outside configured bounds [<min>, <max>] and will be clamped.`
`warn` · `lib/public-services/ng-diagram-viewport.service.ts:139` · `ng-diagram-viewport`
- When: `setViewport(x, y, scale)` (since 1.2.0) with a scale outside the bounds. The clamped scale is applied.
- Fix: pass a scale inside `zoom.min` / `zoom.max`, or ignore the warning if clamping is what you want.

### `[ngDiagram] Invalid zoom scale: <scale>`
`error` · `core/src/command-handler/commands/zoom.ts:22` · `ng-diagram-viewport`
- When: a zoom ends with a scale that is 0, negative, `NaN` or infinite, for example `zoom(0)`, `zoom(NaN)` or `setViewport(x, y, NaN)`. Nothing changes.
- Fix: check how the factor or scale is computed.

### `[ngDiagram] Invalid scale calculated in zoom-to-fit: <scale>`
`error` · `core/src/command-handler/commands/zoom-to-fit.ts:161` · `ng-diagram-viewport`
- When: the fit computes an invalid scale, which happens when node positions or sizes contain `NaN`, or `zoom.min` / `zoom.max` are not valid positive numbers.
- Fix: check the model data and the zoom config.

## Palette

### `[ngDiagram] Invalid drop data: expected type "NgDiagramPaletteItem".`
`warn` · `lib/directives/input-events/palette-drop/palette-drop.directive.ts:74` · `ng-diagram-palette`
- When: something that is not a palette item is dropped on the diagram (text, a link, an element from another drag-and-drop library) and its `text/plain` data is not JSON.
- What happens: the drop is ignored and `paletteItemDropped` does not fire. The message says the drop "will continue with empty data object", but the code returns early.
- Fix: nothing to fix for stray drops. To accept your own drags, start them from `<ng-diagram-palette-item>`.

### `[ngDiagram] Failed to parse palette drop data as JSON.`
`error` · `lib/directives/input-events/palette-drop/palette-drop.directive.ts:76` · `ng-diagram-palette`
- When: a palette item drag is active, but the drop's `text/plain` data is not valid JSON, for example because your own `dragstart` code replaced it.
- What happens: the drop is ignored (the code returns early, despite the "will continue" text).
- Fix: do not overwrite the drag data of palette items.

## Visibility

### `[ngDiagram] ngDiagramHidden must be used inside a node or edge template — the binding is ignored.`
`warn`, once per directive · `lib/directives/hidden/ng-diagram-hidden.directive.ts:122` · `ng-diagram-visibility`
- When: `[ngDiagramHidden]` (since 1.4.0) is used outside a node or edge template, for example in a palette preview or a side panel.
- Fix: use it only in node and edge templates; elsewhere use `@if` or CSS.

### `[ngDiagram] ngDiagramHidden is not supported with virtualization enabled and is ignored`
`warn`, once per directive · `lib/directives/hidden/ng-diagram-hidden.directive.ts:113` · `ng-diagram-visibility`
- When: `[ngDiagramHidden]` with `virtualization.enabled`.
- Fix: set the `hidden` flag on the node or edge in the model instead.

### `[ngDiagram] Failed to apply template visibility change.`
`error` · `core/src/flow-core.ts:185` · `ng-diagram-visibility`, `ng-diagram-middleware`
- When: the update that applies changed `[hidden]` / `[ngDiagramHidden]` template bindings failed; the error follows the text. A throwing custom middleware is the usual cause.
- Fix: fix the middleware.

## Undo and redo

### `Undo is not implemented in the current model. Please implement a custom ModelAdapter to support undo functionality.`
`warn` (no prefix) · `lib/model/signal-model-adapter.ts:102` · `ng-diagram-persistence`, `ng-diagram-shortcuts`
- When: the `undo` action runs (default shortcut: primary modifier + Z, Ctrl on Windows/Linux, Cmd on macOS) with the default model from `initializeModel()`, which keeps no history.
- Fix: implement undo/redo in a custom `ModelAdapter` (`initializeModelAdapter`), or remove the `undo` / `redo` bindings with `configureShortcuts`.

### `Redo is not implemented in the current model. Please implement a custom ModelAdapter to support redo functionality.`
`warn` (no prefix) · `lib/model/signal-model-adapter.ts:108` · `ng-diagram-persistence`, `ng-diagram-shortcuts`
- When: the `redo` action runs (default shortcut: primary modifier + Y). Same fix as undo.

## Debug output

### `[ngDiagram] Render: +<added> -<removed> nodes (total: <n>): <ms>ms`
`log` · `core/src/render-strategy/render-performance-logger.ts:21` · `ng-diagram-config`, `ng-diagram-performance`
- When: `debugMode: true` in the config; printed after a render in which the set of rendered nodes changed.
- Fix: set `debugMode: false` to stop it.

### `[ngDiagram] <action types>` followed by `{ initialState, finalState, history, initialUpdate }`
`log` · `core/src/middleware-manager/middlewares/logger/logger.ts:17` · `ng-diagram-config`, `ng-diagram-transactions`, `ng-diagram-middleware`
- When: `debugMode: true` in the config; printed once for every update that runs the middleware chain (viewport moves during a pan, including a minimap drag, skip it and are not logged). The logger is a built-in finishing step of the chain (`core/src/middleware-manager/middleware-manager.ts:117`), so nothing has to be registered; it stays silent while `debugMode` is `false`.
- Use it to see which actions ran and what each middleware changed (`history`). It prints full state objects, so turn it off on large diagrams.

## Errors without the ngDiagram prefix

- Angular `NG0201` / `NullInjectorError` naming an ng-diagram class (for example `RendererService`, `PaletteService`, `FlowCoreProviderService`, `NgDiagramService`): an ng-diagram component or directive (`<ng-diagram-minimap>`, `<ng-diagram-palette-item>`, `[ngDiagramHidden]`) or your own code injecting an ng-diagram service is outside the injector tree of `provideNgDiagram()`. `<ng-diagram>` itself reports this case with the "services are not available" message above. See `ng-diagram-setup`.
- `NG0201` naming `NgDiagramBaseEdgeComponent`: `<ng-diagram-base-edge-label>` or `<ng-diagram-default-edge-label>` is used outside `<ng-diagram-base-edge>`. See `ng-diagram-custom-edges`.
- `NG0203` (`effect() can only be used within an injection context …`, or an `inject()` injection-context error for `initializeModelAdapter`) from `initializeModel()` / `initializeModelAdapter()`: the call runs outside an injection context (after an `await`, in a subscription or event handler, in `ngOnInit`, inside `computed`). Pass an injector: `initializeModel(data, this.injector)` with `private readonly injector = inject(Injector)`. See `ng-diagram-model-init`.
- Angular required-input errors (`NG8008` at build time, `NG0950` "Input ... is required but no value is available yet" at runtime): a required input is missing, for example `[model]` on `<ng-diagram>`, `id` / `type` / `side` on `<ng-diagram-port>`, or `[node]` on `ngDiagramNodeSelected` / `ngDiagramGroupHighlighted`.
- `loggerMiddleware`: the 1.4.0 typings declare it, but the package code does not export it. Importing it compiles, then fails depending on the bundler: a missing-export build error, or `undefined` in the `[middlewares]` chain, which throws a `TypeError` about reading `name` when the diagram starts. You never need it: the logger already runs in every update, and `debugMode: true` turns its output on.

## No message at all

These fail silently; they are listed here because people look for an error first.

- An edge whose `sourcePort` / `targetPort` does not exist on its node (or whose node with that port is missing) is not drawn and logs nothing (`core/src/middleware-manager/middlewares/edges-routing/get-edge-points.ts:32-56,129-133`). Check the port ids; the default node has `port-left` and `port-right`. See `ng-diagram-ports`.
- A new value in the `[config]` binding of `<ng-diagram>` is read only when the model is (re)initialized (`lib/components/diagram/ng-diagram.component.ts:385-401`), except `hideWatermark` and `watermarkPosition`, which follow the binding (`ng-diagram.component.html:28-29`). Change config at runtime with `NgDiagramService.updateConfig()`. See `ng-diagram-config`.
- Content placed inside `<ng-diagram>` other than `<ng-diagram-background>` is not rendered (`lib/components/diagram/ng-diagram.component.html:1-3`), for example a minimap or a toolbar. Place it next to `<ng-diagram>`.
- `NgDiagramNodeService.bringToFront([])` / `sendToBack([])` change nothing: an array, even an empty one, replaces the selection. See `ng-diagram-layering`.

## Messages from older versions

- `[ngDiagram] Node measurement failed: Node element not found.` (1.0.0 to 1.3.x; removed in 1.4.0): with `<ng-diagram>` rendered outside the DOM of the component that declares `provideNgDiagram()` (`ngTemplateOutlet`, a portal, an overlay), changing a node's size or rotation left its ports at old positions. Fixed in 1.4.0; upgrade. See `ng-diagram-ports`.
- `[ngDiagram] Invalid edge coordinates detected` for valid dangling edges loaded from saved data: fixed in 1.3.0; upgrade.
- Angular `NG0602` from `initializeModel()` inside `computed`, `effect` or `linkedSignal` (before 1.2.0): fixed in 1.2.0; upgrade, and pass the injector in those contexts. See `ng-diagram-model-init`.

## Internal: report a bug

Public APIs cannot trigger these in a correctly set-up app. If you see one, report it with a reproduction at https://github.com/synergycodes/ng-diagram/issues (include your ng-diagram and Angular versions).

- `[ngDiagram] Linking event missing target node.` (`core/src/input-events/handlers/linking/linking.handler.ts:30`)
- `[ngDiagram] Relinking event missing target edge.` (`core/src/input-events/handlers/relinking/relinking.handler.ts:30`)
- `[ngDiagram] Resize event missing target node.` (`core/src/input-events/handlers/resize/resize.handler.ts:30`)
- `[ngDiagram] Rotate event missing target node.` (`core/src/input-events/handlers/rotate/rotate.handler.ts:28`)
- `[ngDiagram] Unknown keyboard move direction: "<direction>"` (`core/src/input-events/handlers/keyboard-move-selection/keyboard-move-selection.handler.ts:58`)
- `[ngDiagram] Unknown element type: "<type>"` (`lib/services/flow-resize-observer/flow-resize-processor.service.ts:120`)
- `FlowResizeBatchProcessorService not initialized yet, skipping resize processing` (`lib/services/flow-resize-observer/flow-resize-processor.service.ts:95`)
- `[ngDiagram] Spatial hash error: Attempted to remove from non-existent cell "<cell>".` / `... update non-existent cell ...` (`core/src/spatial-hash/spatial-hash.ts:103`, `113`)
- `[ngDiagram] Event emitter error: <EmitterName> failed.` (`core/src/middleware-manager/middlewares/event-emitter/event-emitter.middleware.ts:84`): the update is applied but some events may be missing. If you use custom middlewares, first check that they produce complete nodes and edges.
- `[ngDiagram] BatchProcessor flush failed.` (`core/src/batch-processor/batch-processor.ts:73`)
- `[ngDiagram] Initialization stabilization failed.` (`core/src/updater/init-updater/init-updater.ts:134`): initialization is forced to finish; first check that the model comes from `initializeModel()` / `initializeModelAdapter()`.
- `No handler registered for event: <name>` (`core/src/input-events/input-events.router.ts:32`)
- `Method not implemented.` (`lib/services/renderer/renderer.service.ts:7`)
- Transaction internals, not reachable through `NgDiagramService.transaction()` (its callback gets no transaction object): `Callback is required when transaction name is provided` (`core/src/flow-core.ts:365`, `core/src/transaction-manager/transaction-manager.ts:134`), `No active transaction. Cannot queue update.` (`transaction-manager.ts:104`), `Cannot emit on rolled back transaction`, `Cannot create savepoint on rolled back transaction`, `Cannot rollback to savepoint on already rolled back transaction` (`core/src/transaction-manager/transaction-context.ts:17`, `30`, `37`), `Savepoint '<name>' not found` (`core/src/transaction-manager/transaction.ts:89`), `Cannot perform operation on aborted transaction` (`transaction.ts:131`).
- `lateNextResult() requires a settled pass` (`core/src/middleware-manager/pass-settlement.ts:73`)
