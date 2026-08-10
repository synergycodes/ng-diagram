# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

### Added

### Fixed

## [1.3.0] - 2026-08-10

### Changed

- **`NgDiagramService.invalidateMeasurements` is awaitable** — it returns a `Promise<void>` that resolves once the triggered re-measurements have settled, so the invalidated elements' `size`, `measuredPorts` and `measuredLabels` read fresh on the next line. An element that delivers no new measurement (unmounted, zero-size, or unchanged) does not stall the promise. Existing call sites keep working (`void` → `Promise<void>`); ignoring the promise is fine ([#778](https://github.com/synergycodes/ng-diagram/pull/778))
- **Awaitable service methods** — every mutating method on the public services (`NgDiagramModelService`, `NgDiagramNodeService`, `NgDiagramSelectionService`, `NgDiagramClipboardService`, `NgDiagramGroupsService`, `NgDiagramViewportService`) now returns a `Promise<void>` that resolves once the change has been applied to the model, so the next line of code reads the updated state. Read it through `getModel()` or the getter methods (`getNodeById`, `getEdgeById`, `getConnectedEdges`, …) — these are synchronous with the model. The `nodes()`, `edges()` and `metadata()` signals refresh with Angular's change detection, so right after the `await` (and inside diagram event handlers) they can still show the previous state. Existing call sites keep working (`void` → `Promise<void>`). **Do not await these promises from inside a middleware** — the update pipeline is not re-entrant and the await would deadlock; fire-and-forget calls are safe there ([#769](https://github.com/synergycodes/ng-diagram/pull/769))

### Added

- **`NgDiagramDefaultEdgeLabelComponent` is now public** — the component rendering the default edge label chip (`ng-diagram-default-edge-label`) is exported from the package, so custom edge templates can compose it inside `ng-diagram-base-edge-label` and get the default label look (theme-aware chip, hover and selected border highlights) without copying its styles. The hover and selected border highlights now work in any edge template, and the new `--edge-label-border-color-hover` and `--edge-label-border-color-selected` variables override their colors (each falling back to `--edge-label-border-color`, then the matching `--ngd-default-edge-stroke-hover`/`-selected` token). ([#777](https://github.com/synergycodes/ng-diagram/pull/777))
- **Configurable resize sides** — `ng-diagram-node-resize-adornment` accepts an `activeSides` input that limits which sides of the node can be grabbed, for example `[activeSides]="['right', 'bottom']"` for a node anchored at its top-left corner. All four lines keep rendering (they double as the selection frame), but the ones left out are inert and show no resize cursor, and a corner handle renders only when both of its sides are listed. Omitting the input keeps all four sides and corners active, so existing templates are unaffected. The new `Side` type names one of the four sides of a rectangular area; `PortSide` is now an alias of it ([#775](https://github.com/synergycodes/ng-diagram/pull/775))
- **Remove ports from default nodes** – this is now possible to remove ports from default nodes ([#759](https://github.com/synergycodes/ng-diagram/pull/759))
- `waitForMeasurements` option on service methods — `addNodes`, `addEdges`, `updateNode`, `updateNodes`, `updateNodeData`, `updateEdge`, `updateEdges`, `updateEdgeData` on `NgDiagramModelService`, `resizeNode` on `NgDiagramNodeService` and `paste` on `NgDiagramClipboardService` accept `options?: { waitForMeasurements?: boolean }`; when set, the returned promise resolves only after the elements affected by the change have been measured — useful whenever the next step depends on real dimensions (for example `zoomToFit()` or `centerOnNode()`). The option exists only on methods whose changes can trigger measurements; deletions and other model-only operations have nothing to measure, so awaiting the method itself is already enough there. Inside an already active transaction the option is ignored with a console warning — pass `{ waitForMeasurements: true }` to the transaction itself instead ([#769](https://github.com/synergycodes/ng-diagram/pull/769))
- **Customizable runtime-property stripping** – `initializeModel` and `initializeModelAdapter` accept an optional `InitializeModelOptions` parameter to control which properties are stripped on initialization and `toJSON()`. Overriding the defaults can break the diagram — use at your own risk ([#760](https://github.com/synergycodes/ng-diagram/pull/760))
- **Resize snap offset** — new `computeSnapOffsetForNodeSize` and `defaultResizeSnapOffset` options on `SnappingConfig`. Snapped node sizes now follow the sequence `offset + n * snap` per axis, so a node with a 60px header and a 50px vertical resize snap can snap to 60, 110, 160, … instead of 50, 100, 150, …. Defaults to `{ width: 0, height: 0 }` ([#765](https://github.com/synergycodes/ng-diagram/issues/765), [#770](https://github.com/synergycodes/ng-diagram/pull/770)) — thanks [@logan-brd](https://github.com/logan-brd) for the suggestion! 🙏
- **`NgDiagramService.transaction` always returns the commit promise** — the synchronous-callback overload used to return `void`, and for some async callbacks the commit promise was silently discarded; all overloads now return `Promise<TransactionResult>`, so awaiting a transaction reliably waits for its commit ([#769](https://github.com/synergycodes/ng-diagram/pull/769))
- **Cancel in-progress gestures** – new `NgDiagramService.cancelActiveInteraction()` aborts the active linking, drag, resize, rotate or pan gesture immediately and restores the pre-gesture state: dragged nodes snap back to their initial positions, resized/rotated nodes regain their original geometry, and the temporary edge is discarded (state cleared, document listeners removed, no need to wait for pointer release). Bound to Escape by default via the new `cancelInteraction` shortcut action. The `edgeDrawEnded` event gains a `cancelled` reason, and `nodeDragEnded`/`nodeResizeEnded`/`nodeRotateEnded` gain an optional `cancelReason` field ([#747](https://github.com/synergycodes/ng-diagram/issues/747), [#766](https://github.com/synergycodes/ng-diagram/pull/766))

### Fixed

- **Gesture reliability** — drag, resize, rotate and linking now behave correctly with slow (asynchronous) middlewares and throwing user callbacks: `nodeDragStarted`/`nodeDragEnded`, `nodeResizeStarted`/`nodeResizeEnded` and `nodeRotateStarted`/`nodeRotateEnded` always come in pairs and report the node(s) of their own gesture; a throwing user callback (e.g. connection validation or a grouping check) no longer leaves a gesture stuck — linking cannot become permanently blocked and node measurements are not suppressed afterwards; and deleting a node mid-gesture (while resizing, rotating or linking it) cleans up correctly ([#769](https://github.com/synergycodes/ng-diagram/pull/769))
- **A throwing middleware no longer freezes the diagram** — an uncaught error (or unhandled rejection) inside a middleware used to silently freeze every subsequent update; it now rejects the promise returned by the mutating call and the diagram keeps working ([#769](https://github.com/synergycodes/ng-diagram/pull/769))
- **`waitForMeasurements` no longer resolves early when measurement rounds overlap** — a leftover debounce timer from a previous round could settle a newly started round before its measurements arrived ([#778](https://github.com/synergycodes/ng-diagram/pull/778))
- **Initialization resilience** — an error thrown during initialization (e.g. by a custom `ModelAdapter`) no longer leaves the diagram in a state where nothing gets measured; initialization completes and the error is logged ([#769](https://github.com/synergycodes/ng-diagram/pull/769))
- **`waitForMeasurements` accuracy** — a concurrent unrelated update can no longer make `waitForMeasurements` resolve too early or wait for the wrong elements; the option passed to a nested transaction now logs a warning instead of silently resolving before the updates are applied. As a consequence, a transaction now waits only for measurements caused by its own changes: a transaction with an empty callback resolves immediately, so it no longer works as a barrier that waits for unrelated measurement activity (a pattern some apps used after `invalidateMeasurements`) — `await invalidateMeasurements()` itself instead ([#769](https://github.com/synergycodes/ng-diagram/pull/769))
- **Overlapping transactions no longer lose updates** — a transaction (or a plain service call) issued while a previous un-awaited transaction was still committing used to be silently dropped; every transaction now applies its own updates, and the overlap logs a console warning recommending to await transactions ([#769](https://github.com/synergycodes/ng-diagram/pull/769))
- **Port and edge-label measurements no longer get lost during rapid re-rendering** — fast mount/unmount cycles (e.g. virtualization while panning) could apply port and label updates out of order or drop them entirely when one update failed, leaving stale port positions or labels; a failed batch no longer blocks all future ones either ([#769](https://github.com/synergycodes/ng-diagram/pull/769))
- **`NgDiagramNodeService.resizeNode` now resizes an unselected group** — a programmatic `resizeNode` call targeting a group node used to silently do nothing unless the group was selected; it now applies regardless of selection state, still enforcing the group resize constraints (children containment, minimum node size and resize snapping). Interactive resize behavior is unchanged. Calls that used to silently no-op now apply ([#772](https://github.com/synergycodes/ng-diagram/pull/772))
- **Dangling edges survive persistence** — `initializeModel` and `initializeModelAdapter` no longer strip the authored `sourcePosition`/`targetPosition` of an edge's free endpoint (empty `source`/`target`), and `toJSON()` now includes them in the serialized output, so dangling edges load from a persisted model the same way they work when added at runtime; no more "Invalid edge coordinates detected" for valid dangling edges on init ([#751](https://github.com/synergycodes/ng-diagram/issues/751), [#760](https://github.com/synergycodes/ng-diagram/pull/760))
- **Port `side`/`type` no longer stay stale after a port moves** — recreating a port with the same id in a different place (e.g. toggling a port between a `side: 'left'` and a `side: 'right'` block) now updates `measuredPorts` with the new `side`/`type`, so edges anchor to the correct side; measured `size`/`position` keep coming from the DOM as before. The same applies to edge labels re-registered with a changed `positionOnEdge` ([#750](https://github.com/synergycodes/ng-diagram/issues/750), [#763](https://github.com/synergycodes/ng-diagram/pull/763))
- **Group with children jumping on resize snap** — resizing a group that contains child nodes from the bottom/right edge no longer moves the group when a resize snap is configured ([#765](https://github.com/synergycodes/ng-diagram/issues/765), [#770](https://github.com/synergycodes/ng-diagram/pull/770)) — thanks [@logan-brd](https://github.com/logan-brd) for the issue submission! 🙏
- **Keyboard shortcuts work when a gesture starts with focus outside the diagram** — the resize/rotate handles stop the pointerdown propagation, which used to skip the diagram's focus grab; starting a resize right after clicking an external control (e.g. a toolbar button) left every shortcut dead — in particular Escape could not cancel the gesture. The diagram now takes focus on any pointerdown inside it ([#766](https://github.com/synergycodes/ng-diagram/pull/766))
- **Touch gestures stay exclusive under virtualization** — on touch devices with virtualization enabled, nodes and ports leaving the rendered area during a pan or pinch-zoom no longer reset the internal gesture-exclusivity state, so a stray touch can no longer start a second gesture (drag, resize, linking) in the middle of an active one ([#766](https://github.com/synergycodes/ng-diagram/pull/766))
- **Resize snapping no longer cuts group children** — with `allowResizeBelowChildrenBounds: false`, a snapped group size that would land inside the children bounds now rounds up to the next snap value that still contains the children ([#770](https://github.com/synergycodes/ng-diagram/pull/770))
- **Size changes made right after a resize gesture are no longer overwritten by a stale measurement** — a middleware reverting an invalid resize on `resizeNodeStop`, or a `nodeResizeEnded` handler correcting the size, used to lose when the mouse button was released while still moving; the corrected size now always wins. The resized node is also re-measured once after the gesture, so when CSS (e.g. `min-width`) keeps the element larger than the resized size, the model picks up the element's real size ([#771](https://github.com/synergycodes/ng-diagram/discussions/771), [#776](https://github.com/synergycodes/ng-diagram/pull/776)) — thanks [@logan-brd](https://github.com/logan-brd) for the report and the reproduction! 🙏
- **Releasing the mouse while still moving no longer loses the end of a resize, drag or rotation** — the node used to stop short of where the pointer was released (the faster the release, the bigger the miss; with resize snapping the difference could reach a whole grid step). The release position is now applied as the final update of the gesture, before `nodeDragEnded`/`nodeResizeEnded`/`nodeRotateEnded` fires, so the reported geometry always matches where the pointer stopped ([#771](https://github.com/synergycodes/ng-diagram/discussions/771), [#779](https://github.com/synergycodes/ng-diagram/pull/779))
- **Drawing an edge is cancelled when another touch gesture takes over** — on touch devices, a two-finger pan or pinch started in the middle of drawing an edge used to finish the edge at the other finger's position, sometimes connecting it to a target the user never pointed at; the drawing is now cancelled and `edgeDrawEnded` reports the `cancelled` reason ([#779](https://github.com/synergycodes/ng-diagram/pull/779))

## [1.2.4] - 2026-06-02

### Changed

- **Improved trackpad gestures support** - panning with a trackpad now smoothly pans the diagram. Pinching defaults to zooming in/out on the diagram ([#717](https://github.com/synergycodes/ng-diagram/pull/717))

### Fixed

- **Panning direction change with Shift** - On MacOS devices pressing the Shift and using the wheel on a mouse didn't change the panning axis ([#717](https://github.com/synergycodes/ng-diagram/pull/717))

## [1.2.3] - 2026-05-07

### Changed

- **Updated z-index defaults** — `selectedZIndex` changed from `1000` to `10000` to provide more headroom for explicit `zOrder` values; `temporaryEdgeZIndex` changed from `1000` to `2147483647` (max 32-bit int) so the edge being drawn always renders on top ([#697](https://github.com/synergycodes/ng-diagram/pull/697))

### Added

- `invalidateMeasurements(options?)` method on `NgDiagramService` — forces re-measurement of nodes, ports, and edge labels via `ResizeObserver`. Call with no arguments to re-measure the entire diagram, or pass `{ nodes: [...], edges: [...] }` to target specific elements. Invalidating a node also re-measures all its ports. Use this when CSS-only repositioning (class toggles, style bindings) changes port positions without changing sizes, which `ResizeObserver` cannot detect ([#698](https://github.com/synergycodes/ng-diagram/pull/698))
- `initialConnectedEdgesMap` on `MiddlewareContext` — a `Map<string, string[]>` from node ID to connected edge IDs (source or target) captured before any modifications. Allows middleware to find edges connected to specific nodes without scanning all edges ([#697](https://github.com/synergycodes/ng-diagram/pull/697))
- **MCP server: inline code snippets** — `search_docs` and `get_doc` now resolve `<CodeSnippet>` and `<CodeViewer>` tags in documentation pages, inlining the referenced source files directly into tool results. AI assistants see complete, runnable examples without needing access to the source repository ([#699](https://github.com/synergycodes/ng-diagram/pull/699))

### Fixed

- **Z-ordering reworked** — rewrote the z-index assignment middleware and `bringToFront`/`sendToBack` commands, fixing multiple issues: children are now always rendered above their parent group regardless of `zOrder` values, and siblings within a group are correctly re-sorted when `zOrder`, selection, or group membership changes.([#697](https://github.com/synergycodes/ng-diagram/pull/697))
- Fixed ports and edge labels not being measured when a node or edge is removed and re-added with the same ID in the same tick ([#701](https://github.com/synergycodes/ng-diagram/pull/701))

## [1.2.2] - 2026-04-30

### Changed

- Reworked port and label measurement pipeline to batch DOM reads and writes, reducing layout thrashing during bulk operations ([#671](https://github.com/synergycodes/ng-diagram/pull/671))

### Added

- `getChangedNodeIds()` and `getChangedEdgeIds()` helpers on `MiddlewareHelpers` — return IDs of all nodes/edges with property changes in the current update ([#671](https://github.com/synergycodes/ng-diagram/pull/671))

### Fixed

- Fixed `waitForMeasurements` transaction not tracking port measurements, causing the transaction to resolve before ports were measured ([#685](https://github.com/synergycodes/ng-diagram/pull/685))
- Fixed race condition when applying multiple port changes in a single transaction ([#671](https://github.com/synergycodes/ng-diagram/pull/671))
- Fixed touch input (text fields, dropdowns) inside custom nodes not responding on iOS/iPadOS due to `preventDefault` in the box selection touch handler ([#686](https://github.com/synergycodes/ng-diagram/pull/686))

## [1.2.1] - 2026-04-21

### Added

- New [Templates](https://www.ngdiagram.dev/docs/templates/) section — we're excited to introduce a dedicated space for production-grade starter kits curated and built by the ngDiagram team. Kicking it off with an interactive [Org Chart](https://github.com/synergycodes/ng-diagram-orgchart) starter kit featuring drag-and-drop reordering, expand/collapse subtrees, sidebar node editing, dynamic layouts, dark/light theme, minimap, and automatic tree layout powered by ELK.js. Clone it, explore the code, and use it as a launchpad for your own app! 🚀 ([#667](https://github.com/synergycodes/ng-diagram/pull/667))

### Fixed

- Fixed linking state not being cleared when edge drawing fails before creating a temporary edge (e.g., starting from a target port), which permanently blocked all subsequent edge drawing ([#666](https://github.com/synergycodes/ng-diagram/pull/666))

## [1.2.0] - 2026-04-20

### Added

- `deferNodeUpdates` input on `NgDiagramMinimapComponent` — freezes minimap node positions during drag, resize, and rotation operations, updating only when the interaction ends. Use this to eliminate minimap overhead in large diagrams ([#638](https://github.com/synergycodes/ng-diagram/pull/638))
- `watermarkPosition` property on `FlowConfig` — allows configuring the watermark corner position via `NgDiagramPanelPosition`, with automatic collision avoidance when a panel occupies the same corner ([#621](https://github.com/synergycodes/ng-diagram/issues/621), [#652](https://github.com/synergycodes/ng-diagram/pull/652)) — thanks [@jimmeryn](https://github.com/jimmeryn) for the issue submission! 🙏
- `setViewport(x, y, scale)` method on `NgDiagramViewportService` — sets absolute viewport position and scale in a single call, enabling custom-anchor `zoomToFit` implementations ([#591](https://github.com/synergycodes/ng-diagram/discussions/591), [#653](https://github.com/synergycodes/ng-diagram/pull/653)) — thanks [@MeMeMax](https://github.com/MeMeMax) for the discussion that led to this! 🙏
- Generic type parameters on `NgDiagramModelService` getter methods (`getNodeById`, `getEdgeById`, `getConnectedNodes`, `getConnectedEdges`, `getChildren`, `getChildrenNested`, `getParentHierarchy`, `getOverlappingNodes`, `getNodesInRange`, `getNearestNodeInRange`, `getNodeEnds`) — eliminates the need for `as` casts when accessing typed `node.data` or `edge.data` ([#654](https://github.com/synergycodes/ng-diagram/pull/654))
- Exported `DataObject` type from public API ([#654](https://github.com/synergycodes/ng-diagram/pull/654))
- `edgeDrawEnded` event — fires on every linking gesture completion (success and cancel), with source, drop position, and cancel reason (`noTarget`, `invalidConnection`, `invalidTarget`) ([#637](https://github.com/synergycodes/ng-diagram/issues/637), [#655](https://github.com/synergycodes/ng-diagram/pull/655)) — thanks [@ninjapiratica](https://github.com/ninjapiratica) for the inspiration! 🙏
- `selectNodeOnPortPress` option on `LinkingConfig` — when `false`, port press only initiates linking without selecting the parent node. Default `true` preserves existing behavior ([#637](https://github.com/synergycodes/ng-diagram/issues/637), [#655](https://github.com/synergycodes/ng-diagram/pull/655)) — thanks [@ninjapiratica](https://github.com/ninjapiratica) for the issue submission! 🙏

### Changed

- Minimap now caches `MinimapNodeData` by `Node` object reference, reusing cached data for unchanged nodes and reducing per-frame computation during interactions ([#638](https://github.com/synergycodes/ng-diagram/pull/638))

### Fixed

- `initializeModel` can now be safely called inside reactive contexts (`computed`, `effect`, `linkedSignal`) without throwing NG0602 ([#608](https://github.com/synergycodes/ng-diagram/issues/608), [#622](https://github.com/synergycodes/ng-diagram/pull/622))
- Fixed palette drag preview not rendering when an ancestor element has `overflow: hidden` ([#624](https://github.com/synergycodes/ng-diagram/pull/624))
- Fixed port position not updating when `side` or `originPoint` input changes at runtime ([#647](https://github.com/synergycodes/ng-diagram/pull/647)) — thanks [@ninjapiratica](https://github.com/ninjapiratica) for the issue submission! 🙏
- Fixed `waitForMeasurements` incurring a 2-second timeout when a transaction includes no-op updates ([#648](https://github.com/synergycodes/ng-diagram/pull/648))
- Fixed node position not being snapped when node snapping is enabled and node is dropped from palette or pasted onto the canvas ([#649](https://github.com/synergycodes/ng-diagram/pull/649))
- Fixed port hitbox (`::before` pseudo-element) not being centered on the port ([#650](https://github.com/synergycodes/ng-diagram/pull/650))
- `updateNodeData` and `updateEdgeData` now accept interfaces and union types — relaxed generic constraint from `Record<string, unknown> | undefined` to `DataObject` ([#654](https://github.com/synergycodes/ng-diagram/pull/654))

### Deprecated

- `edgeDrawn` event — use `edgeDrawEnded` instead, which fires for both successful and cancelled draws. `edgeDrawn` continues to fire for backward compatibility ([#655](https://github.com/synergycodes/ng-diagram/pull/655))

## [1.1.2] - 2026-03-17

### Changed

- Updated MCP server README with ASCII diagrams, Windows setup instructions, and streamlined documentation ([#610](https://github.com/synergycodes/ng-diagram/pull/610))
- Added MCP Server documentation page and updated roadmap status ([#610](https://github.com/synergycodes/ng-diagram/pull/610))

### Fixed

- Fixed broken internal documentation URLs in Configuration, Edges, Changelog, and Policies pages ([#610](https://github.com/synergycodes/ng-diagram/pull/610))
- Exported missing `PanningActionState` and `SelectionActionState` types from public API ([#610](https://github.com/synergycodes/ng-diagram/pull/610))

## [1.1.1] - 2026-03-12

### Added

- New MCP server for enhanced AI-assisted development with MiniSearch indexing and API symbol search ([#590](https://github.com/synergycodes/ng-diagram/pull/590))

### Fixed

- Fixed documentation pages being difficult to read on mobile devices due to excessive margins ([#605](https://github.com/synergycodes/ng-diagram/pull/605) - thanks [@martinboue](https://github.com/martinboue) for reporting this 💪)

## [1.1.0] - 2026-02-27

### Added

- Zoom support in [Shortcut Manager](https://www.ngdiagram.dev/docs/guides/shortcut-manager/) - configurable keyboard shortcuts (`keyboardZoomIn`, `keyboardZoomOut`) and wheel-based zoom with modifier keys (`zoom`) via new `WheelOnlyShortcutDefinition` ([#571](https://github.com/synergycodes/ng-diagram/pull/571))
- Start and end lifecycle events for node interactions: [`nodeDragStarted`](https://www.ngdiagram.dev/docs/api/components/ngdiagramcomponent/#nodedragstarted)/[`nodeDragEnded`](https://www.ngdiagram.dev/docs/api/components/ngdiagramcomponent/#nodedragended), [`nodeResizeStarted`](https://www.ngdiagram.dev/docs/api/components/ngdiagramcomponent/#noderesizestarted)/[`nodeResizeEnded`](https://www.ngdiagram.dev/docs/api/components/ngdiagramcomponent/#noderesizeended), [`nodeRotateStarted`](https://www.ngdiagram.dev/docs/api/components/ngdiagramcomponent/#noderotatestarted)/[`nodeRotateEnded`](https://www.ngdiagram.dev/docs/api/components/ngdiagramcomponent/#noderotateended) ([#572](https://github.com/synergycodes/ng-diagram/pull/572))
- [`selectionGestureEnded`](https://www.ngdiagram.dev/docs/api/types/events/selectiongestureendedevent) event - fires on pointerup after a selection gesture completes (object click, box selection, or select-all), providing the currently selected nodes and edges. Use this for actions that should run after selection is done, such as showing toolbars or updating panels ([#582](https://github.com/synergycodes/ng-diagram/pull/582))
- [Absolute edge label positioning](https://www.ngdiagram.dev/docs/guides/edges/labels/#absolute-positioning) - `positionOnEdge` now accepts pixel-based strings (`'30px'`, `'-20px'`) in addition to relative numbers (0–1). Negative pixel values measure from the target end ([#580](https://github.com/synergycodes/ng-diagram/pull/580))
- Default edge now supports `positionOnEdge` data property to control [label positioning](https://www.ngdiagram.dev/docs/guides/edges/labels/#using-labels-in-default-edges) (defaults to `0.5`) ([#581](https://github.com/synergycodes/ng-diagram/pull/581))
- [`nodeIds`](https://www.ngdiagram.dev/docs/api/internals/draggingactionstate/#nodeids) property on `DraggingActionState` containing IDs of all nodes participating in the drag operation ([#572](https://github.com/synergycodes/ng-diagram/pull/572))
- [`movementStarted`](https://www.ngdiagram.dev/docs/api/internals/draggingactionstate/#movementstarted) property on `DraggingActionState` that indicates whether pointer movement exceeded the drag threshold before entering the dragging state ([#569](https://github.com/synergycodes/ng-diagram/pull/569))
- [`initializeModelAdapter`](https://www.ngdiagram.dev/docs/api/utilities/initializemodeladapter) function for initializing custom [`ModelAdapter`](https://www.ngdiagram.dev/docs/api/types/model/modeladapter/) implementations. Use this when providing a custom adapter (e.g., backed by localStorage, NgRx, or an external store). The function prepares the adapter for use with ng-diagram. `initializeModel` continues to create the default `SignalModelAdapter` from `Partial<Model>` data. ([#586](https://github.com/synergycodes/ng-diagram/pull/586))

### Changed

- [Custom Model example](https://www.ngdiagram.dev/docs/examples/custom-model) now uses `initializeModelAdapter` and improved `LocalStorageModelAdapter` with `Partial<Model>` and `ModelChanges` types ([#586](https://github.com/synergycodes/ng-diagram/pull/586))

### Fixed

- Added explicit `ModelAdapter` return type to `initializeModel()` to prevent TypeScript errors when building with `declaration: true` ([#573](https://github.com/synergycodes/ng-diagram/pull/573)) (thanks [@MeMeMax](https://github.com/MeMeMax) for reporting this 💪)
- Edge labels vanishing permanently after model reinitialization ([#585](https://github.com/synergycodes/ng-diagram/pull/585))
- Edge labels not being measured when loading a model with pre-existing edge points (e.g., from localStorage) ([#586](https://github.com/synergycodes/ng-diagram/pull/586))
- `selectionChanged` event now fires after paste action, ensuring selection state stays in sync ([#584](https://github.com/synergycodes/ng-diagram/pull/584))
- Fixed compatibility issue with Angular 18 in default edge and minimap components ([#587](https://github.com/synergycodes/ng-diagram/pull/587))

## [1.0.0] - 2026-02-06

🎉 **We've reached v1.0!** This milestone marks a stable, feature-complete library for building interactive diagrams in Angular. We'd love to hear your feedback — share your thoughts in our [GitHub Discussions](https://github.com/synergycodes/ng-diagram/discussions) or join us on [Discord](https://discord.gg/FDMjRuarFb)!

### Added

- [Virtualization](https://www.ngdiagram.dev/docs/guides/virtualization/) for performance optimization on large diagrams - renders only visible elements within the viewport ([#513](https://github.com/synergycodes/ng-diagram/pull/513))
- [Minimap component](https://www.ngdiagram.dev/docs/guides/minimap/) for bird's-eye view navigation of diagrams ([#537](https://github.com/synergycodes/ng-diagram/pull/537))
- [Touch Gestures](https://www.ngdiagram.dev/docs/guides/touch-gestures/) documentation article explaining touch device support ([#530](https://github.com/synergycodes/ng-diagram/pull/530))
- [`nodeDraggingEnabled`](https://www.ngdiagram.dev/docs/api/types/configuration/flowconfig/#nodedraggingenabled) config option and per-node [`draggable`](https://www.ngdiagram.dev/docs/api/types/model/simplenode/#draggable) property to disable node dragging via mouse and keyboard ([#539](https://github.com/synergycodes/ng-diagram/pull/539) - thanks for raising this [@advayumare](https://github.com/advayumare) 💪)
- [`stopLinking`](https://www.ngdiagram.dev/docs/api/services/ngdiagramservice/#stoplinking) method to cancel programmatic linking action on touch devices ([#524](https://github.com/synergycodes/ng-diagram/pull/524))

### Changed

- Improved diagram panning on Mac with Figma-like trackpad experience ([#498](https://github.com/synergycodes/ng-diagram/pull/498))

### Fixed

- Fixed keyboard shortcuts not working when CapsLock is enabled. Letter key shortcuts (e.g., Ctrl+C, Ctrl+V, Ctrl+A) now match case-insensitively ([#546](https://github.com/synergycodes/ng-diagram/pull/546))
- Fixed model reinitialization issues: viewport dimensions being undefined (causing `zoomToFit` and linking failures) and missing `_internalId` for nodes (causing Angular tracking issues) ([#523](https://github.com/synergycodes/ng-diagram/pull/523))
- `toJSON()` now strips readonly computed fields (`measuredPorts`, `measuredBounds`, `computedZIndex`) from serialized nodes and (`measuredLabels`, `computedZIndex`) from serialized edges. These are system-computed values that should be re-derived from the DOM on load, not persisted ([#545](https://github.com/synergycodes/ng-diagram/pull/545))

## [0.9.1] - 2026-01-08

### Fixed

- Fixed resizing group with rotated child nodes ([#504](https://github.com/synergycodes/ng-diagram/pull/504))
- Fixed error on drag&drop HTML object (not palette node) to the diagram ([#510](https://github.com/synergycodes/ng-diagram/pull/510))

## [0.9.0] - 2025-12-12

### Added

- API stability and deprecation policy documentation with defined stability levels and Angular version support matrix ([#462](https://github.com/synergycodes/ng-diagram/pull/462))
- API Extractor integration for automated breaking change detection with CI validation ([#462](https://github.com/synergycodes/ng-diagram/pull/462))
- Landing page diagram example in documentation ([#464](https://github.com/synergycodes/ng-diagram/pull/464))
- [Floating edges](https://www.ngdiagram.dev/docs/guides/edges/floating-edges/) for edges with no ports specified ([#465](https://github.com/synergycodes/ng-diagram/pull/465))
- [Ports with custom content](https://www.ngdiagram.dev/docs/guides/nodes/ports/#custom-content) - ports can now render custom Angular components instead of simple circles ([#468](https://github.com/synergycodes/ng-diagram/pull/468))
- [`hideWatermark`](https://www.ngdiagram.dev/docs/api/types/configuration/flowconfig/#hidewatermark) config option to hide the ngDiagram watermark via diagram configuration ([#469](https://github.com/synergycodes/ng-diagram/pull/469))
- Expose [`computePartsBounds`](https://www.ngdiagram.dev/docs/api/services/ngdiagrammodelservice/#computepartsbounds) method in API ([#477](https://github.com/synergycodes/ng-diagram/pull/477))
- Added overload to [`getOverlappingNodes`](https://www.ngdiagram.dev/docs/api/services/ngdiagrammodelservice/#getoverlappingnodes) to accept `Node` object in addition to node ID, supporting cases when the node object has newer data than the node in state (e.g., within middlewares) ([#486](https://github.com/synergycodes/ng-diagram/pull/486))
- [`modelActionTypes`](https://www.ngdiagram.dev/docs/api/types/middleware/middlewarecontext/#modelactiontypes) property on `MiddlewareContext` - an array containing all action types that triggered the middleware execution. For transactions, this includes the transaction name followed by all action types from commands executed within the transaction. For single commands, this is a single-element array ([#489](https://github.com/synergycodes/ng-diagram/pull/489))
- Add grab cursor on background when panning ([#479](https://github.com/synergycodes/ng-diagram/pull/479))
- Disable diagram panning by config [`viewportPanningEnabled`](https://www.ngdiagram.dev/docs/api/types/configuration/flowconfig/#viewportpanningenabled) ([#480](https://github.com/synergycodes/ng-diagram/pull/480))
- [Async transaction](https://www.ngdiagram.dev/docs/guides/transactions/#async-transactions) support - transactions now accept async callbacks, allowing asynchronous operations like data fetching before adding or modifying the diagram ([#493](https://github.com/synergycodes/ng-diagram/pull/493))
- [`waitForMeasurements`](https://www.ngdiagram.dev/docs/guides/transactions/#waitformeasurements) transaction option - ensures the transaction promise resolves only after all DOM measurements (node sizes, port positions, edge labels) are complete. Useful when performing viewport operations like `zoomToFit()` after adding or modifying elements ([#493](https://github.com/synergycodes/ng-diagram/pull/493))

### Changed

- Standardized error messages across the ng-diagram library ([#463](https://github.com/synergycodes/ng-diagram/pull/463))

### Fixed

- Fixed misleading error when destroying `NgDiagramModelService` after engine is already destroyed. The error incorrectly reported "Library engine not initialized yet". Now the service checks if engine is available and skips listener cleanup if already destroyed. ([#466](https://github.com/synergycodes/ng-diagram/issues/466) - thanks for finding this [@Filipstrozik](https://github.com/Filipstrozik) 💪)
- Fixed keyboard movement of nodes with arrow keys when using large snap step values ([#461](https://github.com/synergycodes/ng-diagram/pull/461))
- Fixed drag-snapping issues with different snapping configurations. The issue still occurred when dragging multiple nodes at the same hierarchy level (i.e., nodes without groups) ([#470](https://github.com/synergycodes/ng-diagram/pull/470))
- Fixed incorrectly computed measuredBounds for nodes ([#486](https://github.com/synergycodes/ng-diagram/pull/486))
- Fixed missing edge arrowheads in Safari. Safari doesn't support `context-stroke` in SVG markers, so a fallback using inline markers with `currentColor` substitution is now used for Safari compatibility ([#487](https://github.com/synergycodes/ng-diagram/pull/487))
- Fixed copy-paste retaining `groupId` when pasting nodes outside their group. Now `groupId` is only preserved when the group is also copied, with the reference updated to the new group's ID ([#491](https://github.com/synergycodes/ng-diagram/pull/491))
- Fixed zoom to fit not working correctly on diagram initialization ([#492](https://github.com/synergycodes/ng-diagram/pull/492))
- Fixed bullet points styles in the documentation ([#494](https://github.com/synergycodes/ng-diagram/pull/494))

### Deprecated

- `modelActionType` property on `MiddlewareContext` is now deprecated. Use `modelActionTypes` instead, which supports multiple actions from transactions. ([#489](https://github.com/synergycodes/ng-diagram/pull/489))

## [0.8.1] - 2025-11-20

### Added

- Tailwind CSS example in documentation ([#436](https://github.com/synergycodes/ng-diagram/pull/436))

### Fixed

- Fixed drag snapping with different snapping config issue ([#451](https://github.com/synergycodes/ng-diagram/pull/451))
- Fixed ungrouping when dragging node selected with group ([#446](https://github.com/synergycodes/ng-diagram/pull/446))
- Fixed shortcut capture, events, and collision with inputs ([#447](https://github.com/synergycodes/ng-diagram/pull/447))
- Fixed zIndex assignment ([#449](https://github.com/synergycodes/ng-diagram/pull/449))
- Fixed Layout in documentation ([#438](https://github.com/synergycodes/ng-diagram/pull/438))
- Fixed Reactive config in background ([#445](https://github.com/synergycodes/ng-diagram/pull/445))
- Fixed Example zomming in documentation ([#448](https://github.com/synergycodes/ng-diagram/pull/448))

## [0.8.0] - 2025-11-07

🎉 **This is our first stable release!** We've graduated from beta and are proud to present a production-ready version.

### Added

- Zoom to fit feature with configurable padding and option to automatically apply on model initialization ([#386](https://github.com/synergycodes/ng-diagram/pull/386))
- Environment layer for unified environment - related functionalities ([#350](https://github.com/synergycodes/ng-diagram/pull/350))
- Helpers for node relationships and traversal ([#395](https://github.com/synergycodes/ng-diagram/pull/395))
- Box selection for selecting multiple nodes at once ([#374](https://github.com/synergycodes/ng-diagram/pull/374))
- Implemented multiple event hooks for ng-diagram ([#387](https://github.com/synergycodes/ng-diagram/pull/387))
- Configurable built-in grid background ([#397](https://github.com/synergycodes/ng-diagram/pull/397))
- Configurable Shortcut Manager ([#398](https://github.com/synergycodes/ng-diagram/pull/398))
- Improved collision detection for rotated nodes and introduced `measuredBounds` property to Node interface ([#407](https://github.com/synergycodes/ng-diagram/pull/407))
- Improved diagram navigation experience - smooth panning ([#417](https://github.com/synergycodes/ng-diagram/pull/417))
- Snapping documentation article explaining node snapping functionality ([#414](https://github.com/synergycodes/ng-diagram/pull/414))
- Diagram configuration documentation article ([#419](https://github.com/synergycodes/ng-diagram/pull/419))
- Microsnapping for angle adjustments ([#404](https://github.com/synergycodes/ng-diagram/pull/404))
- Background guide documentation article ([#400](https://github.com/synergycodes/ng-diagram/pull/400))
- Label support for default edges ([#376](https://github.com/synergycodes/ng-diagram/pull/376))
- Default node exported for public use ([#377](https://github.com/synergycodes/ng-diagram/pull/377))
- Center on node and center on rect command handlers for programmatic viewport control ([#371](https://github.com/synergycodes/ng-diagram/pull/371))

### Changed

- Renamed 'internal' folder to 'guides' in documentation and updated all related links ([#358](https://github.com/synergycodes/ng-diagram/pull/358))
- Improved documentation examples structure for consistency ([#360](https://github.com/synergycodes/ng-diagram/pull/360))
- Unified documentation styles ([#357](https://github.com/synergycodes/ng-diagram/pull/357))
- Redirected documentation root to quick-start page and reordered Intro articles ([#370](https://github.com/synergycodes/ng-diagram/pull/370))
- Changed default behavior for resizable and rotatable properties on diagram nodes ([#374](https://github.com/synergycodes/ng-diagram/pull/374))
- Complete API documentation reorganization and improvements ([#421](https://github.com/synergycodes/ng-diagram/pull/421))
- Better configuration for resizable and rotatable properties on diagram nodes ([#374](https://github.com/synergycodes/ng-diagram/pull/374))

### Fixed

- Fixed `NgDiagramModelService.addEdges` not redrawing diagram ([#369](https://github.com/synergycodes/ng-diagram/pull/369))
- Fixed download image example not working in Angular 18 ([#375](https://github.com/synergycodes/ng-diagram/pull/375))
- Fixed model synchronization issues ([#372](https://github.com/synergycodes/ng-diagram/pull/372))
- Fixed base edge label component name and maintained backward compatibility with deprecated `BaseEdgeLabelComponent` alias ([#368](https://github.com/synergycodes/ng-diagram/pull/368))
- Fixed ESLint errors in Angular templates ([#367](https://github.com/synergycodes/ng-diagram/pull/367))
- Fixed multiple documentation issues and broken API links ([#356](https://github.com/synergycodes/ng-diagram/pull/356))
- Fixed post-release Angular 18 issues ([#355](https://github.com/synergycodes/ng-diagram/pull/355))
- Resolved context menu example to enable copying multiple nodes
- Fixed diagram capturing all keyboard events on page ([#444](https://github.com/synergycodes/ng-diagram/pull/444))
- Fixed zIndex assignment for added nodes and multiple selection of group and children ([#449](https://github.com/synergycodes/ng-diagram/pull/449))

## [0.4.0-beta.5] - 2025-10-14

Initial tagged release.

[unreleased]: https://github.com/synergycodes/ng-diagram/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/synergycodes/ng-diagram/compare/v1.2.4...v1.3.0
[1.2.4]: https://github.com/synergycodes/ng-diagram/compare/v1.2.3...v1.2.4
[1.2.3]: https://github.com/synergycodes/ng-diagram/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/synergycodes/ng-diagram/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/synergycodes/ng-diagram/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/synergycodes/ng-diagram/compare/v1.1.2...v1.2.0
[1.1.2]: https://github.com/synergycodes/ng-diagram/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/synergycodes/ng-diagram/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/synergycodes/ng-diagram/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/synergycodes/ng-diagram/compare/v0.9.1...v1.0.0
[0.9.1]: https://github.com/synergycodes/ng-diagram/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/synergycodes/ng-diagram/releases/tag/v0.9.0
[0.8.1]: https://github.com/synergycodes/ng-diagram/releases/tag/v0.8.1
[0.8.0]: https://github.com/synergycodes/ng-diagram/releases/tag/v0.8.0
[0.4.0-beta.5]: https://github.com/synergycodes/ng-diagram/releases/tag/v0.4.0-beta.5
