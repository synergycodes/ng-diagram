---
name: ng-diagram-minimap
description: Use when adding or customizing the ng-diagram minimap - placement, size, zoom controls, nodeStyle colors, custom minimap node templates, edges or hidden nodes in it, a slow minimap, or a minimap that does not show up.
license: Apache-2.0
---

# Minimap

The `<ng-diagram-minimap>` overview panel (since 1.0.0): placement, inputs, node styling, custom node templates, theming, performance, and building your own minimap with `NgDiagramMinimapNavigationDirective`. Viewport APIs (zoom, pan, fit) are in the `ng-diagram-viewport` skill.

## Rules

- Place `<ng-diagram-minimap>` next to `<ng-diagram>`, not inside it, in a wrapper with `position: relative`, inside the component that has `provideNgDiagram()` (or below it). `<ng-diagram>` projects only `<ng-diagram-background>`, so a minimap placed inside it is never shown. The minimap is `position: absolute` in the nearest positioned ancestor.
- The minimap draws nodes only: no edges, labels or ports. Effectively hidden nodes (`computedHidden`) are not drawn and do not enlarge the minimap bounds (since 1.4.0).
- With virtualization enabled, the minimap draws no nodes at all. It shows the visible-area frame and a shaded rectangle for the whole diagram.
- Prefer the `nodeStyle` function or CSS variables. `minimapNodeTemplateMap` renders one Angular component per node inside a `foreignObject`, which is slow on large diagrams.
- `nodeStyle` results are cached per node object, and the cache is cleared only when the function (or the template map) is replaced. Read only the node inside it; to restyle from app state, pass a new function.
- On large diagrams, set `[deferNodeUpdates]="true"` (since 1.2.0).

## Add a minimap

```ts
import { Component } from '@angular/core';
import {
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramMinimapComponent,
  initializeModel,
  provideNgDiagram,
} from 'ng-diagram';

@Component({
  selector: 'app-diagram',
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent, NgDiagramMinimapComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="diagram-container">
      <ng-diagram [model]="model">
        <ng-diagram-background />
      </ng-diagram>
      <ng-diagram-minimap position="bottom-left" [width]="240" [height]="160" />
    </div>
  `,
  styles: `
    .diagram-container {
      position: relative; /* the minimap is absolutely positioned inside this box */
      display: flex;
      height: 600px;
    }
  `,
})
export class DiagramComponent {
  model = initializeModel({
    nodes: [
      { id: '1', position: { x: 0, y: 0 }, data: { label: 'Start' } },
      { id: '2', position: { x: 300, y: 120 }, data: { label: 'End' } },
    ],
  });
}
```

| Input | Type | Default |
| --- | --- | --- |
| `position` | `NgDiagramPanelPosition`: `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom-right'` |
| `width`, `height` | number, pixels of the map area | `200`, `150` |
| `showZoomControls` | boolean | `true` |
| `nodeStyle` | `MinimapNodeStyleFn` | none |
| `minimapNodeTemplateMap` | `NgDiagramMinimapNodeTemplateMap` | empty map |
| `deferNodeUpdates` (since 1.2.0) | boolean | `false` |

- Dragging on the minimap pans the diagram: the visible-area frame follows the pointer (mouse and touch). A click without moving does nothing; there is no jump-to-point.
- The zoom controls show `−`, the zoom percent and `+`. Each click changes the scale by 0.1 (10 percentage points); a button is disabled when the next step would pass `zoom.min` / `zoom.max`. They are not configurable; build your own buttons with `NgDiagramViewportService` if you need more.
- The panel adds its padding and the zoom controls around `width` × `height`.
- The ngDiagram watermark moves out of the minimap's corner by itself (since 1.2.0). Pick its corner with `watermarkPosition` (see the `ng-diagram-setup` skill).

## Color nodes by type or status

```ts
import { Component } from '@angular/core';
import { NgDiagramMinimapComponent, type MinimapNodeStyleFn } from 'ng-diagram';

interface TaskData {
  status?: 'ok' | 'error';
}

@Component({
  selector: 'app-task-minimap',
  imports: [NgDiagramMinimapComponent],
  template: `<ng-diagram-minimap [nodeStyle]="nodeStyle" />`,
})
export class TaskMinimapComponent {
  // Reads only the node, so the per-node cache stays correct.
  readonly nodeStyle: MinimapNodeStyleFn = (node) => {
    const data = node.data as TaskData; // node.data is typed `object`
    if (node.selected) return { fill: '#2196f3', opacity: 1 };
    if (data.status === 'error') return { fill: '#f44336' };
    if (node.type === 'database') return { shape: 'ellipse' };
    return null; // CSS defaults: --ngd-minimap-node-color / --ngd-minimap-node-opacity
  };
}
```

`MinimapNodeStyle` fields, all optional: `shape` (`'rect'` default, `'circle'`, `'ellipse'`), `fill`, `stroke`, `strokeWidth`, `opacity`, `cssClass`. Returning `null`, `undefined` or `{}` keeps the CSS defaults.

## Highlight nodes from app state

The style function runs again only for nodes whose object changed (moved, selected, data updated). For search results, filters or a "highlight type" toggle, give the minimap a new function whenever that state changes:

```ts
import { Component, computed, signal } from '@angular/core';
import { NgDiagramMinimapComponent, type MinimapNodeStyleFn } from 'ng-diagram';

@Component({
  selector: 'app-search-minimap',
  imports: [NgDiagramMinimapComponent],
  template: `<ng-diagram-minimap [nodeStyle]="nodeStyle()" />`,
})
export class SearchMinimapComponent {
  readonly matchIds = signal<ReadonlySet<string>>(new Set());

  // A new function on every change clears the minimap's per-node style cache.
  readonly nodeStyle = computed<MinimapNodeStyleFn>(() => {
    const matches = this.matchIds();
    return (node) => (matches.has(node.id) ? { fill: '#f59e0b', opacity: 1 } : { opacity: 0.4 });
  });
}
```

## Style with a CSS class

`cssClass` is added next to `minimap-node` on the node's SVG `<g>`, which lives inside the minimap component. Write the rule in a global stylesheet, because your component styles do not reach it. `fill` set on the `<g>` is inherited by the shape:

```css
/* global stylesheet */
.minimap-node.critical {
  fill: #dc2626;
  opacity: 1;
}
```

Values from `nodeStyle` (`fill`, `stroke`, `strokeWidth`, `opacity`) are inline styles and win over class rules.

## Custom node templates

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  NgDiagramMinimapComponent,
  NgDiagramMinimapNodeTemplateMap,
  type MinimapNodeStyle,
  type NgDiagramMinimapNodeTemplate,
  type Node,
} from 'ng-diagram';

@Component({
  selector: 'app-image-minimap-node',
  template: `<img [src]="imageUrl()" alt="" />`,
  styles: `
    :host { display: contents; }
    img { width: 100%; height: 100%; object-fit: cover; display: block; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageMinimapNodeComponent implements NgDiagramMinimapNodeTemplate {
  readonly node = input.required<Node>();
  readonly nodeStyle = input<MinimapNodeStyle>(); // required by the interface; may stay unused

  readonly imageUrl = computed(() => (this.node().data as { imageUrl?: string }).imageUrl ?? 'placeholder.png');
}

@Component({
  selector: 'app-image-minimap',
  imports: [NgDiagramMinimapComponent],
  template: `<ng-diagram-minimap [minimapNodeTemplateMap]="templates" />`,
})
export class ImageMinimapComponent {
  // Keyed by node.type; other types (and nodes without a type) keep the default rectangle.
  readonly templates = new NgDiagramMinimapNodeTemplateMap([['image', ImageMinimapNodeComponent]]);
}
```

The component is rendered inside a `foreignObject` with the node's position, size and rotation, so it only has to fill its box. It receives the `node` and the result of `nodeStyle` for that node.

## Theme the minimap

Set these in a global stylesheet or on the wrapper (defaults in `ng-diagram/styles.css`; the full list is in the `ng-diagram-styling` skill, `references/css-variables.md`):

- Panel: `--ngd-minimap-background`, `--ngd-minimap-border-color`, `--ngd-minimap-shadow-color`, `--ngd-minimap-border-radius` (`1rem`), `--ngd-minimap-padding` (`0.5rem`), `--ngd-minimap-margin` (`1rem`, distance from the corner).
- Nodes: `--ngd-minimap-node-color`, `--ngd-minimap-node-opacity` (`0.8`).
- Visible-area frame: `--ngd-minimap-viewport-stroke-color`, `--ngd-minimap-viewport-stroke-width` (`1`; the frame follows changes, but the inner padding derived from it is read once, when the minimap is created).
- Diagram bounds (virtualization only): `--ngd-minimap-diagram-bounds-color`, `--ngd-minimap-diagram-bounds-opacity` (`0.3`).
- Zoom controls: `--ngd-nav-button-color`, `-size`, `-border-radius`, `-padding`, `-background-color-hover`, `-color-active`, `-color-disabled`, and `--ngd-zoom-controls-font-size`, `-font-weight`, `-color`.

Panel and button colors come from theme tokens, so they follow `data-theme="dark"`.

## Build your own minimap

`NgDiagramMinimapNavigationDirective` (`[ngDiagramMinimapNavigation]`) is the drag-to-pan behavior of the built-in minimap. You need it only for a minimap of your own, for example one that also draws edges. Put it on your SVG with two required inputs: `transform` (`{ scale, offsetX, offsetY }`; only `scale`, minimap pixels per diagram unit, is read) and `viewport` (from `NgDiagramViewportService.viewport()`). Read `references/custom-minimap.md` for a complete component.

## Edge cases

- `strokeWidth` is in diagram units, because nodes are drawn inside a scaled group: on a big diagram a width of 2 becomes a fraction of a pixel. Highlight with `fill` or `opacity`, or return a `cssClass` (say `outlined`) and add `.minimap-node.outlined > * { vector-effect: non-scaling-stroke; }` to a global stylesheet; the stroke width then counts in screen pixels.
- The minimap frames the content and the visible area together. When you pan far away from the content, the minimap zooms out to show both.
- `deferNodeUpdates` freezes the minimap nodes only while a node is dragged, resized or rotated. The frame keeps moving, and every change made during the gesture appears when it ends.
- A node without a measured `size` is drawn as 100 × 50 at its `position`, rotated by its `angle`.
- Nodes hidden with CSS still appear in the minimap; it only knows the model. Hide them with the `hidden` flag (see the `ng-diagram-visibility` skill).
- The minimap pans even with `viewportPanningEnabled: false`, and its drag skips the middleware chain. For a view that must not move, leave the minimap out.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Minimap not visible at all | It is placed inside `<ng-diagram>`. Make it a sibling of `<ng-diagram>`. |
| `NullInjectorError` / `NG0201` naming an ng-diagram service (for example `RendererService`) | The minimap is outside the component that has `provideNgDiagram()`. Move it there or below it. |
| Minimap stuck to the page corner or in the wrong place | The wrapper lacks `position: relative`. |
| No edges in the minimap | By design. Build your own minimap (see `references/custom-minimap.md`). |
| Minimap empty with virtualization on | By design: only the frame and the diagram bounds are drawn. |
| Collapsed or hidden nodes still drawn | The minimap skips nodes hidden with the `hidden` flag (since 1.4.0), not nodes hidden with CSS. Upgrade and use the flag. |
| Diagram far from (0, 0) looks tiny, big empty area | Fixed in 1.4.0 (bounds no longer include the origin) - upgrade. |
| `node.data?.status` does not compile in `nodeStyle` | `node.data` is `object`. Cast it: `node.data as MyData`. |
| Minimap colors do not update when a filter changes | Cached per node. Pass a new function (`computed`) when the filter changes. |
| `cssClass` has no effect | The rule is in a component stylesheet. Move it to a global stylesheet. |
| Selected-node outline invisible | `strokeWidth` is scaled down. Use `fill` / `opacity` or `vector-effect: non-scaling-stroke`. |
| Minimap slow while dragging | Set `[deferNodeUpdates]="true"`; drop `minimapNodeTemplateMap`. |
| Minimap nodes freeze while dragging | `deferNodeUpdates` is on; that is its purpose. |
| Clicking the minimap does not move the view | Only dragging pans; there is no click-to-jump. |
| Watermark moved to another corner | It avoids the minimap's corner (since 1.2.0). Set `watermarkPosition` or `hideWatermark`. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
