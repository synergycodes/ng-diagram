---
name: ng-diagram-ports
description: Use when adding ports to ng-diagram nodes (<ng-diagram-port>), edges will not connect or attach at the wrong spot, port positions are stale (invalidateMeasurements), ports must be hidden or removed, or port styling and hover.
license: Apache-2.0
---

# Ports

Declaring ports in node templates, how they are placed and measured, custom port content, hiding and removing ports, and port styling. Drawing and validating connections is in `ng-diagram-linking`; node templates in `ng-diagram-custom-nodes`.

## Rules

- **Ports live in templates, not in the model.** Each `<ng-diagram-port>` registers itself, and the library writes the read-only `node.measuredPorts` (`id`, `type`, `side`, `nodeId`, measured `position` and `size` relative to the node). Never write `measuredPorts`. Edges point at a port with `sourcePort`/`targetPort` plus the node id, so a port `id` must be unique within its node only (every default node has `port-left` and `port-right`).
- **Inputs:** `id` (required), `type` (required: `'source' | 'target' | 'both'`), `side` (required: `'top' | 'right' | 'bottom' | 'left'`), `originPoint` (default `'center'`), `hidden` (since 1.4.0). Import `NgDiagramPortComponent`.
- **`type` sets the direction.** A `source` port can only start a link, a `target` port can only receive one, `both` can do both. Other rules belong in `linking.validateConnection` (see `ng-diagram-linking`).
- **`side` does three jobs.** It places the port (middle of the left/right edge, center of the top/bottom edge of its nearest positioned ancestor), it picks the edge anchor (the middle of the port's border on that side; on rotated nodes the side turns in 90° steps), and it sets the direction in which the routed edge leaves. When you move a port with CSS, keep `side` matching where it ends up.
- **Positions are measured, not computed.** Ports are measured again automatically when the port or its node is resized, when the node rotates, and when `side` or `originPoint` change. A pure position change (class toggle, `top`/`left` binding, reordering a port list) is invisible to `ResizeObserver`: call `invalidateMeasurements`.
- **Hide ports with `[hidden]`, not CSS — and only after they were rendered once.** A port hidden from its first render is never measured, so its edges are not drawn. Removing a port (`@if`, `@for`) also needs care: edges that still name it stop following the node.

## Ports in a node template

```typescript
import { Component, input } from '@angular/core';
import { NgDiagramPortComponent, type NgDiagramConfig, type NgDiagramNodeTemplate, type Node } from 'ng-diagram';

@Component({
  selector: 'app-step-node',
  imports: [NgDiagramPortComponent],
  // highlight all ports while the node is hovered ('ng-diagram-port-hoverable' = only the hovered port)
  host: { '[class.ng-diagram-port-hoverable-over-node]': 'true' },
  styles: `:host { display: block; padding: 12px 24px; border: 1px solid #888; border-radius: 8px; }`,
  template: `
    {{ node().data.label }}
    <ng-diagram-port id="in" type="target" side="left" />
    <ng-diagram-port id="out" type="source" side="right" />
    <ng-diagram-port id="error" type="source" side="bottom" />
  `,
})
export class StepNodeComponent implements NgDiagramNodeTemplate<{ label: string }> {
  node = input.required<Node<{ label: string }>>();
}

// Pressing a port starts a link without selecting its node (default: true, since 1.2.0)
export const config = { linking: { selectNodeOnPortPress: false } } satisfies NgDiagramConfig;
```

## Custom content and placement

```html
<ng-diagram-port id="en" type="both" side="left" originPoint="centerLeft" style="top: 20%">
  <span class="pin">EN</span>
</ng-diagram-port>
```

- Projected content turns off the default circle: the port takes the size of its content and gets the class `custom-content`. `--ngd-port-size` affects only the default circle.
- `originPoint` chooses which point of the port sits on the side position: `topLeft`, `topCenter`, `topRight`, `centerLeft`, `center`, `centerRight`, `bottomLeft`, `bottomCenter`, `bottomRight`. The custom-ports example page lists names like `leftTop` — those do not exist.
- Fine-tune placement with an inline `top`/`left` style, as the docs custom-ports example does. An inline `transform` replaces the translation that `originPoint` applies, so include it yourself (for example `transform: translate(-50%, -50%) translateY(4px)`).

## Ports per row (dynamic port list)

```typescript
import { Component, inject, input } from '@angular/core';
import {
  NgDiagramModelService, NgDiagramPortComponent, NgDiagramService, type NgDiagramNodeTemplate, type Node,
} from 'ng-diagram';

interface Field { id: string; label: string; }
interface TableData { name: string; fields: Field[]; }

@Component({
  selector: 'app-table-node',
  imports: [NgDiagramPortComponent],
  styles: `
    :host { display: block; min-width: 160px; border: 1px solid #888; }
    .row { position: relative; padding: 4px 12px; } /* each port is placed relative to its row */
  `,
  template: `
    <div class="title">{{ node().data.name }}</div>
    @for (field of node().data.fields; track field.id) {
      <div class="row">
        {{ field.label }}
        <ng-diagram-port [id]="field.id + '-in'" type="target" side="left" />
        <ng-diagram-port [id]="field.id + '-out'" type="source" side="right" />
      </div>
    }
  `,
})
export class TableNodeComponent implements NgDiagramNodeTemplate<TableData> {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly diagramService = inject(NgDiagramService);
  node = input.required<Node<TableData>>();

  // Reordering moves ports without resizing anything, so ResizeObserver does not see it.
  async moveFieldUp(index: number): Promise<void> {
    if (index === 0) return;
    const { id, data } = this.node();
    const fields = [...data.fields];
    [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
    await this.modelService.updateNodeData<TableData>(id, { ...data, fields });
    await this.diagramService.invalidateMeasurements({ nodes: [{ nodeId: id }] });
    // measuredPorts is fresh here (since 1.3.0)
    console.log(this.modelService.getNodeById(id)?.measuredPorts);
  }
}
```

- Adding a port registers and measures it; a growing row list resizes the node, which re-measures all its ports.
- Track `@for` items by a stable id. A port reads its `id` when it registers, so give a new id through a new port element, not by changing the binding.

## Re-measuring ports

- `invalidateMeasurements(options?)` (since 1.2.3) re-measures nodes, ports and edge labels: `{ nodes: [{ nodeId }] }` re-measures a node and all its ports, `{ edges: [{ edgeId }] }` the labels of an edge, no argument the whole diagram.
- Since 1.3.0 it returns a `Promise` that resolves when the re-measurements have settled, so `measuredPorts` is fresh on the next line (before 1.3.0 it returned `void`). Ignoring the promise is fine.
- Do not `await` it inside a transaction (it resolves before the geometry lands) or inside a middleware (the update pipeline is not re-entrant, the await deadlocks). Fire-and-forget is safe there.
- Since 1.3.0 an empty `transaction(..., { waitForMeasurements: true })` no longer works as a "wait for measurements" barrier. Await `invalidateMeasurements` itself.

## Ports visible only in edit mode (since 1.4.0)

```typescript
import { Component, Injectable, inject, input, signal } from '@angular/core';
import {
  initializeModel, NgDiagramComponent, NgDiagramNodeTemplateMap, NgDiagramPortComponent, provideNgDiagram,
  type NgDiagramNodeTemplate, type Node,
} from 'ng-diagram';

@Injectable()
export class EditModeService {
  // true while the diagram initializes: a port must be rendered once to be measured
  readonly editMode = signal(true);
}

@Component({
  selector: 'app-device-node',
  imports: [NgDiagramPortComponent],
  styles: `:host { display: block; padding: 8px 16px; border: 1px solid #888; }`,
  template: `
    {{ node().data.label }}
    <ng-diagram-port id="in" type="target" side="left" [hidden]="!editMode()" />
    <ng-diagram-port id="out" type="source" side="right" [hidden]="!editMode()" />
  `,
})
export class DeviceNodeComponent implements NgDiagramNodeTemplate<{ label: string }> {
  node = input.required<Node<{ label: string }>>();
  readonly editMode = inject(EditModeService).editMode;
}

@Component({
  selector: 'app-devices',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram(), EditModeService], // one EditModeService per diagram
  template: `<ng-diagram [model]="model" [nodeTemplateMap]="templates" (diagramInit)="editMode.set(false)" />`,
})
export class DevicesComponent {
  readonly editMode = inject(EditModeService).editMode; // a toolbar toggles it later
  templates = new NgDiagramNodeTemplateMap([['device', DeviceNodeComponent]]);
  model = initializeModel({
    nodes: [
      { id: 'a', type: 'device', position: { x: 0, y: 0 }, data: { label: 'A' } },
      { id: 'b', type: 'device', position: { x: 300, y: 0 }, data: { label: 'B' } },
    ],
    edges: [{ id: 'e', source: 'a', sourcePort: 'out', target: 'b', targetPort: 'in', data: {} }],
  });
}
```

- **Measure before you hide.** A port that is `[hidden]` from its first render is never measured, and an edge whose port has no geometry is not drawn. That is why the recipe shows the ports during initialization and hides them in `(diagramInit)`. Ports of nodes added later while hidden (or first rendered later by virtualization) have no geometry until they are shown once.
- A plain `hidden` attribute (no binding) also means hidden.
- A hidden port stays in the DOM with `display: none` and keeps its last measured geometry in `measuredPorts`. It cannot start or receive a link (also through `startLinking`), and the linking preview does not snap to it.
- Edges connected to a hidden port stay visible at the port's last measured position. To hide them too, set their own `hidden` flag (see `ng-diagram-visibility`).
- Hidden ports never block initialization or `waitForMeasurements`, and are measured again when shown.
- The port component sets its own inline `display`, so a CSS `display: none` rule on `ng-diagram-port` does not hide it. Hiding the port's wrapper with CSS is invisible to the library: a port hidden that way at load makes initialization wait for the measurement timeouts (2 to 4 s), and the linking preview can still snap to it.

## Removing a port and its edges

Removing a port (`@if`, `@for`) deletes it from `measuredPorts`. An edge that still has that id in `sourcePort`/`targetPort` is not routed any more: it keeps its last path and does not follow the node. (The Conditional Visibility docs page says such edges connect to the node instead; 1.4.0 does not do that.) Remove or reconnect such edges in the same step:

```typescript
interface PortListData { ports: { id: string }[]; }

// In a component or service: modelService = inject(NgDiagramModelService), diagramService = inject(NgDiagramService)
// Edges keep a removed port's id, so remove (or reconnect) them together with the port.
async removePort(nodeId: string, portId: string): Promise<void> {
  const node = this.modelService.getNodeById<PortListData>(nodeId);
  if (!node) return;
  const edgeIds = this.modelService
    .getConnectedEdges(nodeId)
    .filter((e) => (e.source === nodeId && e.sourcePort === portId) || (e.target === nodeId && e.targetPort === portId))
    .map((e) => e.id);

  await this.diagramService.transaction(() => {
    void this.modelService.deleteEdges(edgeIds);
    void this.modelService.updateNodeData<PortListData>(nodeId, {
      ...node.data,
      ports: node.data.ports.filter((p) => p.id !== portId),
    });
  });
}
```

To keep an edge and attach that end to the node border instead (a floating end), clear the port: `updateEdge(edgeId, { sourcePort: undefined })` (or `targetPort`). With dangling edges enabled you can also detach the end (see `ng-diagram-dangling-edges`).

## Styling

- CSS variables: `--ngd-port-size` (0.25rem), `--ngd-port-background-color`, `--ngd-port-border-color`, `--ngd-port-border-size` (0.125rem), `--ngd-port-border-radius` (50%), `--ngd-port-background-color-hover`, `--ngd-port-border-color-hover`, `--ngd-port-border-size-hover` (0.25rem). Set them on the template host or on a class on the port.
- Hover highlight needs a class on the template host (or any ancestor): `ng-diagram-port-hoverable` highlights only the hovered port, `ng-diagram-port-hoverable-over-node` highlights all ports while the node is hovered (not while the rotate handle is hovered or a rotation is in progress). The default node and `ng-diagram-base-node-template` already set the second one, except during a resize.
- Ports render only on the canvas. In palette previews they are `display: none`.

## Edge cases

- Recreating a port with the same id in another place (for example moving it between a left and a right block) updates `side` and `type` in `measuredPorts` since 1.3.0. Before, the old `side`/`type` stayed and edges anchored to the wrong side.
- Changing `side` or `originPoint` at runtime re-measures the port since 1.2.0.
- Since 1.4.0 ports are measured correctly when `<ng-diagram>` is rendered outside the component that declares `provideNgDiagram()` (`ngTemplateOutlet`, portal, overlay).
- Since 1.4.0 a 0×0 measurement (an element hidden with CSS) no longer overwrites port geometry.
- With virtualization, ports of nodes outside the rendered area keep their entries in `measuredPorts`.
- A port nested anywhere inside the node template is found; the measured position is relative to the node's top-left corner.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Cannot draw an edge from or to a node | No `<ng-diagram-port>` in the template; or the direction is wrong (`source` cannot receive, `target` cannot start); or the port is `[hidden]`. |
| An edge from the model is not drawn and nothing is logged | Its `sourcePort`/`targetPort` does not match a port `id` the template renders (typo; default nodes use `port-left`/`port-right`; the port is behind `@if`; or it was `[hidden]` from the start). Compare with `getNodeById(nodeId)?.measuredPorts?.map((p) => p.id)`. |
| Edges attached to `[hidden]` ports are not drawn at all | The ports were hidden from their first render and never measured. Show them during initialization and hide them in `(diagramInit)`. |
| Edge attaches at an odd point or leaves in the wrong direction | `side` does not match where CSS put the port. The anchor is the middle of the port's border on `side`. |
| Port positions stale after a class toggle, style binding or list reorder | `await ngDiagramService.invalidateMeasurements({ nodes: [{ nodeId }] })` (since 1.2.3). |
| `measuredPorts` read right after the change is stale | Await `invalidateMeasurements` (returns a Promise since 1.3.0), and read through `getNodeById`, not the `nodes()` signal. |
| Edge stops following its node after a port was removed | The edge still names the removed port. Delete it, reconnect it, or clear `sourcePort`/`targetPort`; or hide the port with `[hidden]` instead of removing it. |
| CSS `display: none` on a port does nothing; hiding its wrapper delays init by 2 to 4 s | Use the port's `[hidden]` input (since 1.4.0). |
| `--ngd-port-size` has no effect | The port has projected content; style the content instead. |
| `originPoint="leftTop"` is a type error or ignored | Use the canonical names (`topLeft`, `centerLeft`, ...). |
| Ports do not highlight on hover | Add `ng-diagram-port-hoverable` or `ng-diagram-port-hoverable-over-node` to the template host. |
| Pressing a port also selects the node | `linking.selectNodeOnPortPress: false` (since 1.2.0). |
| Ports missing in palette previews | By design: ports render only on the canvas. |
| After a re-created port, edges use the old side (older versions) | Fixed in 1.3.0 — upgrade. |
| Ports are not measured after a node is removed and added again with the same id in one tick | Fixed in 1.2.3 — upgrade. |
| `Node measurement failed: Node element not found` and ports stay at old positions after resize/rotate; `<ng-diagram>` is inside `ngTemplateOutlet`/portal/overlay | Fixed in 1.4.0 — upgrade. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
