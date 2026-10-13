---
name: ng-diagram-custom-nodes
description: Use when building ng-diagram node templates (NgDiagramNodeTemplateMap), customizing the default node, autoSize vs size, inputs or Angular Material inside nodes (data-no-drag), disabling dragging, or "Node template ... is not registered".
license: Apache-2.0
---

# Custom node templates

How to write, register and size node templates, put interactive content in them, and control dragging and selection styling. Ports are in `ng-diagram-ports`, resize/rotate handles in `ng-diagram-resize-rotate-snap`, group templates in `ng-diagram-groups`, hiding in `ng-diagram-visibility`.

## Rules

- **Template contract.** A node template is a standalone component that implements `NgDiagramNodeTemplate<TData>` and declares `node = input.required<Node<TData>>()`. The diagram renders it with `ngComponentOutlet` and passes the node through an input named `node`, so the name must be exactly `node`.
- **Registration.** Add the component to a `NgDiagramNodeTemplateMap`, bind the map with `[nodeTemplateMap]`, and use the same key as the node's `type`. A node without `type` uses the default node. An unknown `type` logs `[ngDiagram] Node template '<type>' is not registered. Falling back to default node template.` once and renders the default node (the default group template for `isGroup` nodes).
- **Size.** `autoSize` defaults to `true`: the content decides the size, and the library writes the measured size into `node.size`. A `size` you set is not applied in this mode. For a fixed size set `size` and `autoSize: false`. A user resize sets `autoSize: false` for you.
- **Fill the node box.** With a fixed size the library sizes the node wrapper, not your component. Give your component host `display: block` (or `flex`), `width: 100%` and `height: 100%`, so the content and the selection shadow match the node size.
- **Do not mutate `node()`.** Change nodes through `NgDiagramModelService`. `updateNodeData` replaces the whole `data` object, so spread the old data. Never write the system-owned `measuredPorts`, `measuredBounds`, `computedZIndex` or `computedHidden`.
- **Interactive elements** (inputs, selects, scroll areas) need `data-no-drag="true"` and `data-no-pan="true"`. Otherwise pressing them drags the node or pans the canvas.

## Minimal custom node + registration

```typescript
import { Component, input } from '@angular/core';
import {
  initializeModel, NgDiagramComponent, NgDiagramNodeSelectedDirective, NgDiagramNodeTemplateMap,
  NgDiagramPortComponent, provideNgDiagram, type NgDiagramNodeTemplate, type Node,
} from 'ng-diagram';

interface TaskData { title: string; }

@Component({
  selector: 'app-task-node',
  imports: [NgDiagramPortComponent],
  hostDirectives: [{ directive: NgDiagramNodeSelectedDirective, inputs: ['node'] }],
  styles: `:host { display: block; width: 100%; height: 100%; }`,
  template: `
    <div class="task">{{ node().data.title }}</div>
    <ng-diagram-port id="in" type="target" side="left" />
    <ng-diagram-port id="out" type="source" side="right" />
  `,
})
export class TaskNodeComponent implements NgDiagramNodeTemplate<TaskData> {
  node = input.required<Node<TaskData>>();
}

@Component({
  selector: 'app-diagram',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  styles: `:host { display: block; height: 600px; }`,
  template: `<ng-diagram [model]="model" [nodeTemplateMap]="nodeTemplateMap" />`,
})
export class DiagramComponent {
  nodeTemplateMap = new NgDiagramNodeTemplateMap([['task', TaskNodeComponent]]);

  model = initializeModel({
    nodes: [
      { id: 'a', type: 'task', position: { x: 0, y: 0 }, data: { title: 'Auto size' } },
      { id: 'b', type: 'task', position: { x: 300, y: 0 }, size: { width: 220, height: 80 }, autoSize: false, data: { title: 'Fixed size' } },
    ],
    edges: [{ id: 'e1', source: 'a', sourcePort: 'out', target: 'b', targetPort: 'in', data: {} }],
  });
}
```

Without ports a node cannot start or receive a drawn edge (see `ng-diagram-ports`).

## Default node and NgDiagramBaseNodeTemplateComponent

A node without `type` uses the default node. It shows `data.label` (the node id when `data` has no `label` key), is at least 11.25rem × 2rem in auto-size mode, shows resize and rotate handles when selected, and has two ports, `port-left` and `port-right`, both `type="both"`.

```typescript
import { Component, input } from '@angular/core';
import {
  initializeModel, NgDiagramBaseNodeTemplateComponent, NgDiagramPortComponent,
  type NgDiagramConfig, type NgDiagramNodeTemplate, type Node,
} from 'ng-diagram';

// Default nodes connected through their default ports.
export const model = initializeModel({
  nodes: [
    { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Start' } },
    { id: 'n2', position: { x: 300, y: 0 }, data: { label: 'End' } },
  ],
  edges: [{ id: 'e1', source: 'n1', sourcePort: 'port-right', target: 'n2', targetPort: 'port-left', data: {} }],
});

// Alternative setup (do not combine with the model above, whose edges use the default ports):
// remove the two default ports from every default node (since 1.3.0).
export const config = { defaultNode: { removePorts: true } } satisfies NgDiagramConfig;

// Default look with own content and own ports.
@Component({
  selector: 'app-status-node',
  imports: [NgDiagramBaseNodeTemplateComponent, NgDiagramPortComponent],
  template: `
    <ng-diagram-base-node-template [node]="node()" [removeDefaultPorts]="true">
      <strong>{{ node().data.label }}</strong>
    </ng-diagram-base-node-template>
    <ng-diagram-port id="top" type="target" side="top" />
    <ng-diagram-port id="bottom" type="source" side="bottom" />
  `,
})
export class StatusNodeComponent implements NgDiagramNodeTemplate<{ label: string }> {
  node = input.required<Node<{ label: string }>>();
}
```

- `<ng-diagram-base-node-template [node]="node()">` wraps your content in the default look, the resize/rotate handles, the selection style and the default ports.
- `[removeDefaultPorts]` (since 1.3.0): `true` removes the default ports, `false` keeps them even when `defaultNode.removePorts` is `true`. When it is not set, the config decides.
- The config option is read through the `config()` signal, which is filled at `diagramInit`: the default ports render (and are measured) during initialization and disappear right after it. For no default ports from the first render, use `[removeDefaultPorts]="true"` in your own template.
- The `[config]` binding is read when the model is initialized. To change `defaultNode` (or any option) later, call `NgDiagramService.updateConfig({ defaultNode: { removePorts: true } })`.
- Restyle the default node with CSS variables on a container: `--ngd-node-bg-primary-default` (background), `--ngd-node-border-color`, `--ngd-node-border-color-hover`, `--ngd-node-border-radius`, `--ngd-node-border-size`, `--ngd-txt-primary-default` (text), `--ngd-selected-node-box-shadow`. Themes and tokens: `ng-diagram-styling`.

## Inputs, buttons and scrollable content

```html
<!-- typing or selecting text does not drag the node or pan the canvas -->
<input [value]="node().data.title" (change)="rename($event)" data-no-drag="true" data-no-pan="true" />

<!-- the wheel scrolls the list instead of panning the canvas; pressing the list does not drag the node -->
<ul data-no-pan="true" data-no-drag="true">...</ul>

<!-- pressing the button neither selects nor drags the node -->
<button type="button" (pointerdown)="$event.stopPropagation()" (click)="addItem()">Add</button>
```

- The library checks the pointer target with `closest('[data-no-drag="true"]')`, so the attribute works on the element or on any wrapper. The value must be the string `"true"`: `data-no-drag="true"` and `[attr.data-no-drag]="true"` work, a bare `data-no-drag` does not.
- `data-no-drag` stops only the node drag. The press still selects the node, and because the node no longer takes the drag, moving the pointer pans the canvas. That is why inputs need `data-no-pan` too.
- `data-no-pan` also stops wheel panning, so scroll areas inside a node scroll. Ctrl/⌘ + wheel still zooms the diagram.
- No attribute stops selection. Stop the `pointerdown` propagation on the element, as the docs examples do for their toggle buttons.
- Diagram shortcuts skip key events only from `input`, `textarea`, `select` and `contenteditable` elements. In other focused widgets (`mat-select`, custom dropdowns, buttons) the arrow keys also move the selected node and Delete/Backspace delete the selection; stop those keys' propagation in the widget. Shortcut setup: `ng-diagram-shortcuts`.

Read `references/interactive-content.md` for two complete, type-checked templates: a note node (input, scrollable list, button, data updates) and an Angular Material select node (based on the docs example `angular-material-node`).

## Dragging on and off

```typescript
// In your diagram component (modelService = inject(NgDiagramModelService), diagramService = inject(NgDiagramService))
model = initializeModel({
  nodes: [
    { id: 'pinned', position: { x: 0, y: 0 }, draggable: false, data: { label: 'Pinned' } }, // this node only
    { id: 'free', position: { x: 250, y: 0 }, data: { label: 'Free' } },
  ],
});

config = { nodeDraggingEnabled: false } satisfies NgDiagramConfig; // no node can be dragged

async unpin(nodeId: string): Promise<void> {
  await this.modelService.updateNode(nodeId, { draggable: true });
}

// Runtime switch: [config] is read when the model is initialized, later changes to it are ignored
setLocked(locked: boolean): void {
  this.diagramService.updateConfig({ nodeDraggingEnabled: !locked });
}
```

- Both stop pointer drags and arrow-key moves. The node can still be selected, resized and connected. Programmatic moves (`moveNodesBy`, `updateNode`) ignore both flags.
- `nodeDraggingEnabled: false` wins: a node with `draggable: true` still cannot be dragged. (Some docs text says the node property has priority; the source requires both.)
- When the selection cannot move, the arrow keys pan the viewport (since 1.4.0).
- With dragging off, pressing a node and moving the pointer pans the canvas. To stop that for such nodes, put `data-no-pan="true"` on the template host (this also stops wheel panning over the node); `viewportPanningEnabled: false` stops all panning.

## Selection styling

- `NgDiagramNodeSelectedDirective` (as a host directive, or `ngDiagramNodeSelected [node]="node()"` on an inner element) adds the classes `ng-diagram-node-wrapper` and `ng-diagram-node-selected`. The global styles then draw `box-shadow: var(--ngd-selected-node-box-shadow)`. The element needs `display: block` or `flex`, or the shadow is invisible.
- For your own style, read `node().selected`:

```typescript
import { Component, computed, input } from '@angular/core';
import { type NgDiagramNodeTemplate, type Node } from 'ng-diagram';

@Component({
  selector: 'app-card-node',
  host: { '[class.selected]': 'selected()' },
  styles: `
    :host { display: block; border: 1px solid #999; border-radius: 8px; }
    :host(.selected) { outline: 2px solid royalblue; }
  `,
  template: `{{ node().data.label }}`,
})
export class CardNodeComponent implements NgDiagramNodeTemplate<{ label: string }> {
  node = input.required<Node<{ label: string }>>();
  selected = computed(() => this.node().selected ?? false);
}
```

## Hiding part of a node vs hiding the node

- Content inside your template: use `@if` or your own CSS. With `autoSize` the node is measured again.
- Ports: use the port's `[hidden]` input, not CSS (see `ng-diagram-ports`).
- The whole node: the model `hidden` flag or `[ngDiagramHidden]` (since 1.4.0). Never `display: none` on your component host: an auto-size node then never gets a valid size, its ports are never measured, initialization waits for the measurement timeouts (2 to 4 s), and the library still treats the node as visible (selection, `zoomToFit`). See `ng-diagram-visibility`.

## Edge cases

- `type: ''` is not "no type": it logs the warning for `''`. Leave `type` out for the default node.
- The `data-no-drag` check ignores SVG targets: pressing an `<svg>` icon inside a `data-no-drag` button can still drag the node. Give the icon `pointer-events: none`, or stop `pointerdown` on the button.
- Back to content size after a user resize: `await this.modelService.updateNode(nodeId, { autoSize: true });`
- With `autoSize: false` the library still measures the node. When CSS (for example `min-width`) keeps the element bigger than `size`, the model takes the real size.
- Since 1.4.0 a 0×0 measurement is ignored. Before 1.4.0, hiding a node with CSS `display: none` wrote a 0×0 `size` (and port geometry) into the model.
- With virtualization, templates of nodes outside the render area are destroyed and created again when they come back. Keep state that must survive (an open panel, a draft value) in `data` or in a service, not only in component signals.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Node renders as the default node; console shows `[ngDiagram] Node template '<type>' is not registered...` | `type` does not match a map key, or `[nodeTemplateMap]` is not bound. Fix the key or bind the map. |
| Template shows no data or throws a required-input error | The input is not named `node`. Rename it. |
| `size` is ignored or overwritten | `autoSize` is `true` (default). Set `autoSize: false` together with `size`. |
| Content does not fill the node; selection shadow has the wrong size | Host is inline or not full size. Use `display: block`/`flex`, `width: 100%`, `height: 100%`. |
| Selection highlight invisible | The element with `NgDiagramNodeSelectedDirective` is `display: inline`. Make it `block` or `flex`. |
| Typing or selecting text in an input drags the node or pans the canvas | Add `data-no-drag="true"` and `data-no-pan="true"` (value exactly `"true"`). |
| Mouse wheel over a list in a node pans the diagram | Put `data-no-pan="true"` on the scroll container. |
| Clicking a button in a node selects or drags the node | `(pointerdown)="$event.stopPropagation()"` on the button. |
| Arrow keys in a focused widget move the node; Delete removes it | Only `input`/`textarea`/`select`/`contenteditable` are skipped. Stop those keys' propagation in the widget. |
| Node with `draggable: true` cannot be dragged | `nodeDraggingEnabled: false` overrides it. |
| Editing one field clears the other `data` fields | `updateNodeData` replaces `data`. Spread `...node().data`. |
| `--ngd-node-background-color` has no effect | The default node reads `--ngd-node-bg-primary-default`. |
| Edges cannot connect to the node | The template has no `<ng-diagram-port>` (see `ng-diagram-ports`). |
| Node size becomes 0×0 after hiding it with CSS (before 1.4.0) | Fixed in 1.4.0 — upgrade, and hide with the `hidden` flag (`ng-diagram-visibility`). |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
