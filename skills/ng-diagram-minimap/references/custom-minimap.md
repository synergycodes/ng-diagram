# Custom minimap with NgDiagramMinimapNavigationDirective

Build your own minimap when the built-in one is not enough, for example to draw edges, labels or your own shapes. You draw the SVG yourself and reuse the library's drag-to-pan behavior.

Contents: [What the directive does](#what-the-directive-does) · [The math](#the-math-as-in-the-built-in-minimap-without-its-inner-padding) · [Complete component](#complete-component) · [Notes](#notes)

## What the directive does

`NgDiagramMinimapNavigationDirective` (selector `[ngDiagramMinimapNavigation]`, exported since 1.0.0) is the navigation used inside `<ng-diagram-minimap>`:

- On a primary-button `pointerdown` it captures the pointer and listens on `document` for `pointermove`, `pointerup` and `pointercancel` (mouse and touch).
- Each move calls `NgDiagramViewportService.moveViewportBy(-(dx / transform.scale) * viewport.scale, -(dy / transform.scale) * viewport.scale)`, so the visible-area frame follows the pointer. A click without moving does nothing.
- While dragging it puts the diagram in its panning state, and `cancelActiveInteraction()` (Escape by default) ends the drag.

Inputs, both required:

| Input | Type | Meaning |
| --- | --- | --- |
| `transform` | `{ scale: number; offsetX: number; offsetY: number }` | how your SVG maps diagram coordinates; the directive reads only `scale` (minimap pixels per diagram unit). The type is not exported, so pass an object of this shape. |
| `viewport` | `Viewport` | the current viewport, from `NgDiagramViewportService.viewport()` |

The directive needs the diagram engine on `pointerdown`, so render it only after the diagram is initialized (`NgDiagramService.isInitialized()`), inside the component that has `provideNgDiagram()`.

## The math (as in the built-in minimap, without its inner padding)

- Visible area in diagram coordinates: `x = -viewport.x / viewport.scale`, `y = -viewport.y / viewport.scale`, `width = viewport.width / viewport.scale`, `height = viewport.height / viewport.scale`.
- Bounds to show: the union of the content bounds (`NgDiagramModelService.computePartsBounds(nodes, edges)`, which skips hidden elements) and the visible area. The built-in minimap uses node bounds only; this recipe adds edges because it draws them.
- `scale = min(minimapWidth / bounds.width, minimapHeight / bounds.height)`; `offsetX = (minimapWidth - bounds.width * scale) / 2 - bounds.x * scale` (same for y). Draw the content in diagram coordinates inside `<g transform="translate(offsetX, offsetY) scale(scale)">`.

## Complete component

Draws edges as straight lines between their first and last routed point, nodes as rectangles, and the visible area as a frame:

```ts
import { Component, computed, inject } from '@angular/core';
import {
  NgDiagramMinimapNavigationDirective,
  NgDiagramModelService,
  NgDiagramService,
  NgDiagramViewportService,
  type Rect,
} from 'ng-diagram';

const unionRect = (a: Rect, b: Rect): Rect => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
};

@Component({
  selector: 'app-edge-minimap',
  imports: [NgDiagramMinimapNavigationDirective],
  template: `
    @if (ready()) {
      <svg
        ngDiagramMinimapNavigation
        [transform]="transform()"
        [viewport]="viewport()"
        [attr.width]="width"
        [attr.height]="height"
      >
        <g [attr.transform]="groupTransform()">
          @for (line of edgeLines(); track line.id) {
            <line
              [attr.x1]="line.x1"
              [attr.y1]="line.y1"
              [attr.x2]="line.x2"
              [attr.y2]="line.y2"
              stroke="#9ca3af"
              vector-effect="non-scaling-stroke"
            />
          }
          @for (node of nodes(); track node.id) {
            <rect
              [attr.x]="node.position.x"
              [attr.y]="node.position.y"
              [attr.width]="node.size?.width ?? 100"
              [attr.height]="node.size?.height ?? 50"
              fill="#d1d5db"
            />
          }
          <rect
            [attr.x]="visibleArea().x"
            [attr.y]="visibleArea().y"
            [attr.width]="visibleArea().width"
            [attr.height]="visibleArea().height"
            fill="none"
            stroke="#6b7280"
            vector-effect="non-scaling-stroke"
          />
        </g>
      </svg>
    }
  `,
  styles: `
    :host { position: absolute; right: 1rem; bottom: 1rem; z-index: 10; background: var(--ngd-minimap-background); cursor: pointer; }
    svg { display: block; touch-action: none; }
  `,
})
export class EdgeMinimapComponent {
  private readonly model = inject(NgDiagramModelService);
  protected readonly ready = inject(NgDiagramService).isInitialized;
  protected readonly viewport = inject(NgDiagramViewportService).viewport;

  protected readonly width = 240;
  protected readonly height = 160;

  protected readonly nodes = computed(() => this.model.nodes().filter((node) => !node.computedHidden));

  protected readonly edgeLines = computed(() =>
    this.model
      .edges()
      .filter((edge) => !edge.computedHidden && (edge.points?.length ?? 0) > 1)
      .map((edge) => {
        const points = edge.points ?? [];
        const first = points[0];
        const last = points[points.length - 1];
        return { id: edge.id, x1: first.x, y1: first.y, x2: last.x, y2: last.y };
      })
  );

  // The visible part of the diagram in flow coordinates
  protected readonly visibleArea = computed<Rect>(() => {
    const { x, y, scale, width = 0, height = 0 } = this.viewport();
    return { x: -x / scale, y: -y / scale, width: width / scale, height: height / scale };
  });

  // scale = minimap pixels per flow unit; the navigation directive reads only `scale`
  protected readonly transform = computed(() => {
    const content = this.model.computePartsBounds(this.nodes(), this.model.edges());
    const bounds = unionRect(content, this.visibleArea());
    const scale = bounds.width && bounds.height ? Math.min(this.width / bounds.width, this.height / bounds.height) : 1;
    return {
      scale,
      offsetX: (this.width - bounds.width * scale) / 2 - bounds.x * scale,
      offsetY: (this.height - bounds.height * scale) / 2 - bounds.y * scale,
    };
  });

  protected readonly groupTransform = computed(() => {
    const { scale, offsetX, offsetY } = this.transform();
    return `translate(${offsetX}, ${offsetY}) scale(${scale})`;
  });
}
```

Place `<app-edge-minimap />` next to `<ng-diagram>` in a wrapper with `position: relative`, like the built-in minimap. The `z-index: 10` (the built-in value) keeps it above the diagram, and `--ngd-minimap-background` follows the theme.

## Notes

- `NgDiagramModelService.nodes()` / `edges()` refresh with change detection, which is fine for drawing.
- `edge.points` exist only after the edge was routed; an edge without points is skipped above. For curved routings the straight line is a simplification.
- With virtualization enabled, unrendered nodes have no measurements, so `computePartsBounds` may miss them; the built-in minimap then uses node `position` and `size` instead.
- Redrawing every node on every model change costs time on large diagrams. Keep the template simple (plain SVG, no components per node).
