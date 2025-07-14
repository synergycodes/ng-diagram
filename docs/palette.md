# Diagram Palette in AngularFlow

## Context

The `palette` is a `configurable panel` used to provide reusable elements (`nodes`, `groups`, `custom components`) that
can be
dragged into the `diagram`. It helps users `quickly build` or `extend diagrams` by selecting and placing predefined
elements
onto the `canvas`.

## Decision

Since `palette` implementations can vary greatly depending on the product or use case (e.g., static, grouped,
searchable, dynamic), the system doesn't enforce a single `palette` structure.

Instead:

- A reference implementation of a `basic palette` is provided as an example.
- The `angular-adapter package` exposes `ready-to-use` helper functions to simplify integration with the diagram engine.

### Implementation Details

#### PaletteInteractionService from @angularflow/angular-adapter

To help with common `drag-and-drop` behavior, the following functions are available in the **PaletteDragService** (exported
from **angular-adapter**):
- To help with common drag-and-drop behavior, the following functions are available:
  - `onDragStartFromPalette`(data:
  PaletteItemData): DragEventData Used when starting a drag from a palette item. Wraps the item in a standard drag event
  format. handleDropFromPalette: DiagramAction Used when dropping the dragged item on the canvas.
  Automatically creates the appropriate node or group based on the original palette definition.
