# Diagram Palette in AngularFlow

## Context

The `palette` is a `configurable panel` used to provide reusable elements (`nodes`, `groups`, `custom components`) that
can be dragged into the `diagram`. It helps users `quickly build` or `extend diagrams` by selecting and placing
predefined elements on to the `canvas`.

## Decision

Since `palette` implementations can vary greatly depending on the product or use case (e.g., static, grouped,
searchable, dynamic), the system doesn't enforce a single `palette` structure.

Instead:

- A reference implementation of a `basic palette` is provided as an example.
- The `angular-adapter package` exposes `ready-to-use` helper functions to simplify integration with the diagram engine.

### Implementation Details

#### PaletteInteractionService from @angularflow/angular-adapter

To help with common `drag-and-drop` behavior, the following functions are available in the **PaletteDragService**
(exported from angular-adapter):

- **onDragStartFromPalette**(`event`: DragEvent, `node`: PaletteNode):
    - Used when starting a drag from a palette item.
- **handleDropFromPalette**(`event`: DropEvent):
    - Used when dropping the dragged item on the canvas

**Example: handleDropFromPalette**

```lang
  ngAfterViewInit(): void {
    const flowCore = this.flowCoreProvider.provide();
    flowCore.registerEventsHandler((event) => {
      if (event.type === 'drop') {
        this.paletteInteractionService.handleDropFromPalette(event);
      }
    });
  }
```

#### Node Preview in Palette

Displays a visual preview of a node or group directly inside the palette item.

Previews can use the same rendering logic as in the main diagram, or a
simplified version for performance.

```html

<div class="draggable node-preview" draggable="true" (dragstart)="onDragStart($event)">
  <!--  When we want to display only the label -->
  <div class="node-preview-title">{{ nodeLabel() }}</div>
  <!--  Or -->
  <!-- When we want to have the same component on the palette as on the canvas -->
  <ng-container *ngComponentOutlet="template(); inputs: { data: node().data, isPaletteNode: true }" />
</div>
```
