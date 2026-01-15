# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Fixed model reinitialization issues: viewport dimensions being undefined (causing `zoomToFit` and linking failures) and missing `_internalId` for nodes (causing Angular tracking issues) ([#523](https://github.com/synergycodes/ng-diagram/pull/523))

## [0.9.1] - 2026-01-08

### Fixed

- Fixed resizing group with rotated child nodes ([#504](https://github.com/synergycodes/ng-diagram/pull/504))
- Fixed error on drag&drop HTML object (not palette node) to the diagram ([#510](https://github.com/synergycodes/ng-diagram/pull/510))

## [0.9.0] - 2025-12-12

### Added

- API stability and deprecation policy documentation with defined stability levels and Angular version support matrix ([#462](https://github.com/synergycodes/ng-diagram/pull/462))
- API Extractor integration for automated breaking change detection with CI validation ([#462](https://github.com/synergycodes/ng-diagram/pull/462))
- Landing page diagram example in documentation ([#464](https://github.com/synergycodes/ng-diagram/pull/464))
- [Floating edges](/docs/guides/edges/floating-edges/) for edges with no ports specified ([#465](https://github.com/synergycodes/ng-diagram/pull/465))
- [Ports with custom content](/docs/guides/nodes/ports/#custom-content) - ports can now render custom Angular components instead of simple circles ([#468](https://github.com/synergycodes/ng-diagram/pull/468))
- [`hideWatermark`](/docs/api/types/configuration/flowconfig/#hidewatermark) config option to hide the ngDiagram watermark via diagram configuration ([#469](https://github.com/synergycodes/ng-diagram/pull/469))
- Expose [`computePartsBounds`](/docs/api/services/ngdiagrammodelservice/#computepartsbounds) method in API ([#477](https://github.com/synergycodes/ng-diagram/pull/477))
- Added overload to [`getOverlappingNodes`](/docs/api/services/ngdiagrammodelservice/#getoverlappingnodes) to accept `Node` object in addition to node ID, supporting cases when the node object has newer data than the node in state (e.g., within middlewares) ([#486](https://github.com/synergycodes/ng-diagram/pull/486))
- [`modelActionTypes`](/docs/api/types/middleware/middlewarecontext/#modelactiontypes) property on `MiddlewareContext` - an array containing all action types that triggered the middleware execution. For transactions, this includes the transaction name followed by all action types from commands executed within the transaction. For single commands, this is a single-element array ([#489](https://github.com/synergycodes/ng-diagram/pull/489))
- Add grab cursor on background when panning ([#479](https://github.com/synergycodes/ng-diagram/pull/479))
- Disable diagram panning by config [`viewportPanningEnabled`](/docs/api/types/configuration/flowconfig/#viewportpanningenabled) ([#480](https://github.com/synergycodes/ng-diagram/pull/480))
- [Async transaction](/docs/guides/transactions/#async-transactions) support - transactions now accept async callbacks, allowing asynchronous operations like data fetching before adding or modifying the diagram ([#493](https://github.com/synergycodes/ng-diagram/pull/493))
- [`waitForMeasurements`](/docs/guides/transactions/#waitformeasurements) transaction option - ensures the transaction promise resolves only after all DOM measurements (node sizes, port positions, edge labels) are complete. Useful when performing viewport operations like `zoomToFit()` after adding or modifying elements ([#493](https://github.com/synergycodes/ng-diagram/pull/493))

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

[unreleased]: https://github.com/synergycodes/ng-diagram/compare/v0.9.1...HEAD
[0.9.1]: https://github.com/synergycodes/ng-diagram/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/synergycodes/ng-diagram/releases/tag/v0.9.0
[0.8.1]: https://github.com/synergycodes/ng-diagram/releases/tag/v0.8.1
[0.8.0]: https://github.com/synergycodes/ng-diagram/releases/tag/v0.8.0
[0.4.0-beta.5]: https://github.com/synergycodes/ng-diagram/releases/tag/v0.4.0-beta.5
