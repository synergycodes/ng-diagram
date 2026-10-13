---
name: ng-diagram-styling
description: Use when theming or restyling ng-diagram - --ngd-* CSS variables, dark mode (data-theme), node and group colors, the selection ring, group highlight, the dots/grid/custom background, Tailwind, or CSS overrides that have no effect.
license: Apache-2.0
---

# Styling, theming and background

How ng-diagram's CSS is built (files, variable layers, dark theme), how to restyle nodes, groups, ports, selection and the canvas background, and how to use Tailwind. Edge, label, relink-handle, resize-handle and minimap styling belong to other skills (see "State hooks" below). Every variable with its default is in `references/css-variables.md`.

## Rules

- Import `ng-diagram/styles.css` once, in a global stylesheet. It pulls in `tokens.css` and `primitives.css`. The variables live on `:root` and the state classes are global selectors, so an import inside a component stylesheet (encapsulated) does not work.
- Put your overrides after the import. The library also declares on `:root`; with equal specificity the later rule wins.
- Change the CSS variable a component reads, not its CSS properties. Library components use emulated encapsulation: your component styles cannot reach their inner elements, but variables inherit into them.
- Dark theme is `data-theme="dark"` on the `<html>` element, nowhere else. A token you override only in `:root` is lost in dark mode, because `html[data-theme='dark']` is more specific. Give dark values in an `html[data-theme='dark']` block.
- The default node and group backgrounds read the token `--ngd-node-bg-primary-default`. `--ngd-node-background-color` is declared in `styles.css`, but no library template reads it (1.4.0).
- In node templates use `NgDiagramNodeSelectedDirective` / `NgDiagramGroupHighlightedDirective`. If you add the state classes by hand, add `ng-diagram-node-wrapper` too: the selected and highlight styles exist only on `.ng-diagram-node-wrapper.<state>`.
- Do not hide nodes, edges or ports with CSS `display: none`; use the `hidden` flag or inputs (ports set their own inline `display`). See the `ng-diagram-visibility` skill.

## Import the styles

```scss
/* src/styles.scss - global stylesheet */
@import 'ng-diagram/styles.css';

/* your overrides go below the import */
:root {
  --ngd-node-border-radius: 0.5rem;
}
```

Listing `node_modules/ng-diagram/styles.css` in the `styles` array of `angular.json` also works, because that stylesheet is global too. List it before your own stylesheet, so your overrides come later. The package also exports `ng-diagram/tokens.css` and `ng-diagram/primitives.css`, but `styles.css` already imports both.

## Theme with the three layers

| Layer | File and selector | Example | Change it to |
| --- | --- | --- | --- |
| Primitives | `primitives.css`, `:root` | `--ngd-colors-acc1-500` | change the palette in both themes |
| Tokens | `tokens.css`: light in `:root`, dark in `html[data-theme='dark']` | `--ngd-node-bg-primary-default`, `--ngd-diagram-background-color` | change a semantic color per theme |
| Component variables | `styles.css`, `:root` | `--ngd-node-border-radius`, `--ngd-port-size` | change one property of one component |

```css
/* global stylesheet, after the import */
:root {
  --ngd-colors-acc1-500: #0f766e; /* primitive: accent in both themes */
  --ngd-node-border-radius: 0.375rem; /* component variable */
  --ngd-node-bg-primary-default: #fdfcf8; /* token, light value */
}
html[data-theme='dark'] {
  --ngd-node-bg-primary-default: #1f2933; /* token, dark value */
}
```

A component variable set to a fixed color no longer follows the theme. To keep theme switching, point it at a token: `--ngd-node-border-color: var(--ngd-node-stroke-primary-hover);`.

## Dark theme

```ts
import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

@Component({
  selector: 'app-theme-toggle',
  template: `<button type="button" (click)="toggle()">{{ dark() ? 'Light' : 'Dark' }} theme</button>`,
})
export class ThemeToggleComponent {
  private readonly document = inject(DOCUMENT);
  readonly dark = signal(false);

  toggle(): void {
    this.dark.update((dark) => !dark);
    // ng-diagram switches its tokens on html[data-theme='dark'] only
    this.document.documentElement.setAttribute('data-theme', this.dark() ? 'dark' : 'light');
  }
}
```

ng-diagram does not follow `prefers-color-scheme` on its own. To follow the OS, set `data-theme` from `matchMedia('(prefers-color-scheme: dark)')` and update it on its `change` event.

## Style one diagram differently

Variables inherit, so set them on a wrapper around `<ng-diagram>` (global CSS, or an element in your own template):

```css
.orders-diagram {
  --ngd-node-border-color: #d04a02;
  --ngd-node-border-color-hover: #9b0018;
  --ngd-node-bg-primary-default: #240f0f; /* the default node reads this token directly */
  --ngd-txt-primary-default: #ffffff;
  --ngd-selected-node-box-shadow: 0 0 0 0.25rem #9b001852;
}
```

On a wrapper, set the variable the template reads. Component variables are resolved on `:root`, so a token changed on the wrapper does not reach them: `--ngd-node-stroke-primary-default: red` on `.orders-diagram` does not change `--ngd-node-border-color` inside it.

## Custom node with the default look

`NgDiagramNodeSelectedDirective` (required input `node`) always adds `ng-diagram-node-wrapper` and adds `ng-diagram-node-selected` while `node.selected` is true. The ring is a `box-shadow`, so the element needs `display: block` or `flex`.

```ts
import { Component, input } from '@angular/core';
import {
  NgDiagramNodeSelectedDirective,
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';

@Component({
  selector: 'app-task-node',
  imports: [NgDiagramPortComponent],
  hostDirectives: [{ directive: NgDiagramNodeSelectedDirective, inputs: ['node'] }],
  host: { class: 'ng-diagram-port-hoverable-over-node' },
  template: `
    <span>{{ node().data.label }}</span>
    <ng-diagram-port id="in" type="target" side="left" />
    <ng-diagram-port id="out" type="source" side="right" />
  `,
  styles: `
    :host {
      display: block; /* the selection ring is a box-shadow on this element */
      padding: 0.5rem 1rem;
      color: var(--ngd-txt-primary-default);
      background: var(--ngd-node-bg-primary-default); /* same token as the default node */
      border: var(--ngd-node-border-size) solid var(--ngd-node-border-color);
      border-radius: var(--ngd-node-border-radius);
    }
    :host:hover {
      border-color: var(--ngd-node-border-color-hover);
    }
  `,
})
export class TaskNodeComponent implements NgDiagramNodeTemplate<{ label: string }> {
  readonly node = input.required<Node<{ label: string }>>();
}
```

For a fully custom selection look, bind your own class from `node().selected` instead (see the `ng-diagram-custom-nodes` skill).

## Custom group with the default highlight

`NgDiagramGroupHighlightedDirective` (required input `node: GroupNode`) adds `ng-diagram-group-highlight` while `group.highlighted` is true; the library sets it while a dragged node is over the group and `grouping.canGroup` allows the drop. Both directives can share one `[node]` binding in a group template (import `NgDiagramGroupHighlightedDirective`, `NgDiagramNodeSelectedDirective` and `NgDiagramNodeResizeAdornmentComponent`):

```html
<ng-diagram-node-resize-adornment>
  <div class="lane" ngDiagramGroupHighlighted ngDiagramNodeSelected [node]="node()">
    {{ node().data.title }}
  </div>
</ng-diagram-node-resize-adornment>
```

Outside node templates (a legend, a palette item), add the classes yourself: `<div class="ng-diagram-node-wrapper ng-diagram-node-selected">` or `<div class="ng-diagram-node-wrapper ng-diagram-group-highlight">`.

## Port hover

Put one class on the node host or on a wrapper around the ports:

- `ng-diagram-port-hoverable-over-node` - all ports light up while the node is hovered (not while the rotate handle is hovered or a rotation runs). `ng-diagram-base-node-template` adds it to itself, except during a resize.
- `ng-diagram-port-hoverable` - only the port under the pointer lights up.

The hover look comes from `--ngd-port-background-color-hover`, `--ngd-port-border-color-hover` and `--ngd-port-border-size-hover`.

## Background

```ts
import { Component, signal } from '@angular/core';
import {
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  initializeModel,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';

@Component({
  selector: 'app-editor',
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  template: `
    <ng-diagram [model]="model" [config]="config">
      @switch (background()) {
        @case ('grid') {
          <ng-diagram-background type="grid" />
        }
        @case ('dots') {
          <ng-diagram-background />
        }
        @default {
          <ng-diagram-background>
            <img src="blueprint.svg" alt="" style="width: 100%; height: 100%; object-fit: cover" />
          </ng-diagram-background>
        }
      }
    </ng-diagram>
  `,
})
export class EditorComponent {
  readonly background = signal<'dots' | 'grid' | 'custom'>('grid');
  model = initializeModel({ nodes: [{ id: '1', position: { x: 0, y: 0 }, data: { label: 'A' } }] });

  config = {
    background: {
      cellSize: { width: 20, height: 20 }, // grid: minor cell size
      majorLinesFrequency: { x: 5, y: 5 }, // grid: a major line every 5 cells
      dotSpacing: 24, // dots
    },
  } satisfies NgDiagramConfig;
}
```

- `<ng-diagram-background>` must be a direct child of `<ng-diagram>` (inside `@if` or `@switch` is fine when it is the only element in that block). It is the only element that `<ng-diagram>` projects.
- `type` is `'dots'` (default) or `'grid'`. Config defaults: `dotSpacing: 30`, `cellSize: { width: 10, height: 10 }`, `majorLinesFrequency: { x: 5, y: 5 }`.
- To change spacing at runtime, call `inject(NgDiagramService).updateConfig({ background: { dotSpacing: 12 } })`; the patterns read `NgDiagramService.config()` and redraw. A new value in the `[config]` binding is not picked up: `<ng-diagram>` reads `[config]` only when the model is (re)initialized.
- Pattern variables: `--ngd-background-dot-color`, `--ngd-background-line-minor-color` / `-major-color`, `--ngd-background-line-minor-width` / `-major-width`, `--ngd-background-line-minor-opacity` / `-major-opacity`.
- Projected content replaces the pattern, fills the canvas and does not pan or zoom. The component checks for content only once, when it is created, so switch between custom and built-in by swapping elements (as above), not by changing the content of one element.
- A plain color needs no component: set the token on the element, `ng-diagram { --ngd-diagram-background-color: #fafafa; }`. Declared on the element itself, it wins in both themes. A `background` property works only from the stylesheet of the component that renders `<ng-diagram>`; in a global stylesheet the library's encapsulated `:host` rule is more specific.

## Tailwind CSS

Utility classes work in node templates as in any component. The docs Tailwind example puts `flex w-full h-full rounded-lg` on the node host, which also gives the selection ring a block box. With Tailwind v4, tie the `dark:` variant to the attribute ng-diagram uses, as the docs site does:

```css
@import 'tailwindcss';
@import 'ng-diagram/styles.css';
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

## State hooks owned by other skills

- Edges: classes `selected`, `temporary` and `dangling` (since 1.4.0) on `ng-diagram-base-edge` and its path (`ng-diagram-edge__path`); `ng-diagram-edge--temporary` and `ng-diagram-edge--dangling` on the edge wrapper (since 1.4.0); variables `--edge-stroke*` and `--ngd-default-edge-stroke*`. See `ng-diagram-custom-edges` and `ng-diagram-dangling-edges`.
- Edge labels: `--edge-label-*` and `--ngd-default-edge-label-*`. See `ng-diagram-custom-edges`.
- Relink handles (since 1.4.0): `--ngd-relink-handle-*` for the theme, `--edge-relink-handle-*` per edge. See `ng-diagram-edge-relinking`.
- Resize and rotate handles: `--ngd-resize-*` and `--ngd-rotate-handle-*`. See `ng-diagram-resize-rotate-snap`.
- Minimap and its zoom controls: `--ngd-minimap-*`, `--ngd-nav-button-*`, `--ngd-zoom-controls-*`. See `ng-diagram-minimap`.
- `<ng-diagram>` itself gets the classes `pannable`, `panning`, `linking` and `relinking` for its cursors. They are not documented; for logic, read `NgDiagramService.actionState()` instead.

## Edge cases

- The accent shades are separate primitives: `--ngd-colors-acc1-400`, `-500`, `-600`, plus the transparent `-500-40` (selection ring, relink halo) and `-500-50` (group highlight). Rebrand them together, or the ring keeps the old purple.
- Groups use the same background token as nodes (`--ngd-node-bg-primary-default`). `--ngd-group-background-color-highlight` is declared but not read.
- While selected, the ring replaces your element's own `box-shadow` (the library rule is more specific). Put your shadow into `--ngd-selected-node-box-shadow` if you need both. The ring follows the `border-radius` of the element that has the class.
- Box-selection colors (`--ngd-box-selection-*`, fixed color values) and default edge colors (`--ngd-default-edge-stroke*`, built from primitives) have no dark-theme values. They do not change with the theme unless you set dark values yourself.
- Dots fade out as you zoom out and disappear at zoom 0.3 or below. Grid line widths stay the same on screen at every zoom.
- `styles.css` sets `box-sizing: border-box` on every element inside `<ng-diagram>`, including your node templates.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Diagram looks unstyled, variables do nothing | `ng-diagram/styles.css` is missing or imported in a component stylesheet. Import it in the global stylesheet. |
| A `:root` override is ignored | It comes before the library import (same specificity, the earlier rule loses). Move it below the import. |
| Override works in light mode only | You overrode a token in `:root`; `html[data-theme='dark']` wins in dark mode. Add a dark block. |
| Dark theme does not apply | `data-theme="dark"` is on `body` or a wrapper. Set it on `<html>`. |
| `--ngd-node-background-color` does not recolor default nodes | No library template reads it in 1.4.0. Override `--ngd-node-bg-primary-default`. |
| A token set on a wrapper changes only some things (for example `--ngd-node-stroke-primary-default` does not recolor borders) | Component variables are resolved on `:root` from the tokens there. On a wrapper, set the component variable (`--ngd-node-border-color`) or a token the template reads directly (`--ngd-node-bg-primary-default`, `--ngd-txt-primary-default`). |
| `ng-diagram-node-selected` shows no ring | `ng-diagram-node-wrapper` is missing on the same element. |
| Selection ring invisible on a custom node | The host is `display: inline`. Give it `display: block` or `flex`. |
| Build or runtime error about the required input `node` | `ngDiagramNodeSelected` / `ngDiagramGroupHighlighted` need `[node]`. Without a node object, use the classes. |
| Ports never light up on hover | Add `ng-diagram-port-hoverable-over-node` or `ng-diagram-port-hoverable` to the node host or a wrapper. |
| Rebranded accent, but the ring is still purple | The ring uses `--ngd-colors-acc1-500-40`. Override it too, or set `--ngd-selected-node-box-shadow`. |
| Background not shown | `<ng-diagram-background>` sits inside another element within `<ng-diagram>`. Make it a direct child. |
| Grid or dots gone after adding content | Projected content replaces the pattern, by design. |
| Custom background does not pan or zoom | By design. Move it yourself from `NgDiagramViewportService.viewport()`. |
| Dots disappear when zoomed out | By design at zoom 0.3 or below. Use the grid or a custom background. |
| New `background` values in `[config]` change nothing | `[config]` is read only at model init. Call `NgDiagramService.updateConfig({ background: … })`. |
| `ng-diagram { background: … }` changes nothing | The library's encapsulated `:host` rule is more specific than a global `ng-diagram` rule. Set `--ngd-diagram-background-color` on `ng-diagram` instead. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
