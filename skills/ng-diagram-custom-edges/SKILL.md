---
name: ng-diagram-custom-edges
description: Use when customizing how ng-diagram edges look - edge templates (NgDiagramEdgeTemplate, ng-diagram-base-edge), edge labels, arrowheads and custom markers, selected or temporary edge CSS, or the "Edge template ... is not registered" warning.
license: Apache-2.0
---

# Custom edges, labels and arrowheads

How edges look: edge templates, `<ng-diagram-base-edge>` inputs and CSS variables, labels, markers and state classes. Path shapes are in `ng-diagram-edge-routing`, user-drawn edges in `ng-diagram-linking`, relink handles in `ng-diagram-edge-relinking`, free ends in `ng-diagram-dangling-edges`, themes in `ng-diagram-styling`, hiding in `ng-diagram-visibility`.

## Rules

- A custom edge is a standalone component that implements `NgDiagramEdgeTemplate<T>` with `edge = input.required<Edge<T>>()` and renders `<ng-diagram-base-edge [edge]="...">`. The base edge draws the path and markers, makes the edge clickable and selectable, positions labels and shows relink handles. A template without it gets none of that.
- Registration has three parts that must match: a key in `new NgDiagramEdgeTemplateMap([['key', Cmp]])`, the map on `<ng-diagram [edgeTemplateMap]="...">`, and `edge.type === 'key'`. An unknown `type` renders the default edge and logs a warning once per type. An edge without `type` renders the default edge without a warning.
- Edges drawn by users get no `type` unless a linking builder sets one. Add it in `linking.finalEdgeDataBuilder` (see `ng-diagram-linking`), or drawn edges keep the default look.
- `updateEdgeData(id, data)` replaces the whole `data` object. Spread the old data: `{ ...edge.data, label }`.
- Use `<ng-diagram-base-edge-label>` and `<ng-diagram-default-edge-label>` only inside `<ng-diagram-base-edge>`: both inject the surrounding base edge and fail with a DI error anywhere else. Give each label of an edge its own `id`, because its position is looked up by id.
- Read, never write, the system-computed edge fields: `measuredLabels`, `points` (auto routing), `sourcePosition`/`targetPosition` of connected ends, `computedZIndex`, `computedHidden`.
- Know the precedence: `edge.sourceArrowhead`/`targetArrowhead` in the model beat the `[sourceArrowhead]`/`[targetArrowhead]` inputs. `[routing]` works the other way: the input beats `edge.routing` and is written into the model. `[stroke]`, `[strokeWidth]`, `[strokeOpacity]` and `[strokeDasharray]` beat the CSS variables.
- Recolor the default edge with the variables `--ngd-default-edge-stroke`, `--ngd-default-edge-stroke-hover` and `--ngd-default-edge-stroke-selected` (on `ng-diagram` or `:root`). The default edge sets `--edge-stroke` in its own encapsulated rules, which are more specific than a page rule on `ng-diagram-base-edge.default-edge`. These variables do not follow `data-theme="dark"`, so set dark values yourself.

## Minimal custom edge + registration

```typescript
import { Component, computed, input } from '@angular/core';
import {
  initializeModel, NgDiagramBaseEdgeComponent, NgDiagramComponent, NgDiagramEdgeTemplateMap, provideNgDiagram,
  type Edge, type NgDiagramEdgeTemplate,
} from 'ng-diagram';

type FlowEdgeData = { kind: 'sync' | 'async' };

@Component({
  selector: 'app-flow-edge',
  imports: [NgDiagramBaseEdgeComponent],
  template: `
    <ng-diagram-base-edge
      [edge]="edge()"
      [strokeDasharray]="dashed() ? '6 4' : undefined"
      targetArrowhead="ng-diagram-arrow"
    />
  `,
})
export class FlowEdgeComponent implements NgDiagramEdgeTemplate<FlowEdgeData> {
  edge = input.required<Edge<FlowEdgeData>>();
  dashed = computed(() => this.edge().data.kind === 'async');
}

@Component({
  selector: 'app-diagram',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `<ng-diagram [model]="model" [edgeTemplateMap]="edgeTemplateMap" />`,
})
export class DiagramComponent {
  edgeTemplateMap = new NgDiagramEdgeTemplateMap([['flow', FlowEdgeComponent]]);

  model = initializeModel({
    nodes: [
      { id: 'a', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', position: { x: 300, y: 0 }, data: {} },
    ],
    edges: [
      {
        id: 'e1', source: 'a', sourcePort: 'port-right', target: 'b', targetPort: 'port-left',
        type: 'flow', // must equal the map key
        data: { kind: 'async' },
      },
    ],
  });
}
```

## Style by state

Set CSS variables on `ng-diagram-base-edge` in the edge component's styles. The host gets state classes:

```scss
ng-diagram-base-edge { --edge-stroke: #334155; --edge-stroke-width: 2; }
ng-diagram-base-edge.selected { --edge-stroke: #2563eb; --edge-stroke-width: 3; }
ng-diagram-base-edge:hover:not(.selected) { --edge-stroke: #64748b; }
ng-diagram-base-edge.temporary { --edge-stroke-opacity: 0.6; } // preview of a draw or relink
ng-diagram-base-edge.dangling { --edge-stroke-dasharray: 6 4; } // a free end (since 1.4.0)
```

The `<ng-diagram-edge>` element that wraps your template gets `ng-diagram-edge--temporary` and `ng-diagram-edge--dangling` (since 1.4.0). For styles driven by logic, bind the inputs from a `computed()`, for example `[stroke]="edge().selected ? '#2563eb' : '#334155'"`. Read `references/edge-css-reference.md` when you need every input, variable, default or label chip variable.

The `<path>` belongs to the base edge's own view, so your component styles reach it only through the `--edge-*` variables and the inputs. For other path properties (for example an animated `stroke-dashoffset`), put a rule in a global stylesheet, such as `ng-diagram-base-edge.flowing path { ... }` with `class="flowing"` on your `<ng-diagram-base-edge>`.

## Labels in a custom edge

```typescript
import { Component, computed, inject, input } from '@angular/core';
import {
  NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent, NgDiagramDefaultEdgeLabelComponent,
  NgDiagramModelService, type Edge, type NgDiagramEdgeTemplate,
} from 'ng-diagram';

type LabeledEdgeData = { label?: string };

@Component({
  selector: 'app-labeled-edge',
  imports: [NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent, NgDiagramDefaultEdgeLabelComponent],
  template: `
    <ng-diagram-base-edge [edge]="edge()">
      <ng-diagram-base-edge-label [id]="'text'" [positionOnEdge]="0.5" [hidden]="!label()">
        <ng-diagram-default-edge-label>{{ label() }}</ng-diagram-default-edge-label>
      </ng-diagram-base-edge-label>
      @if (edge().selected) {
        <ng-diagram-base-edge-label [id]="'delete'" [positionOnEdge]="'-28px'">
          <button data-no-pan="true" data-no-drag="true" (click)="remove()">Delete</button>
        </ng-diagram-base-edge-label>
      }
    </ng-diagram-base-edge>
  `,
})
export class LabeledEdgeComponent implements NgDiagramEdgeTemplate<LabeledEdgeData> {
  private readonly modelService = inject(NgDiagramModelService);

  edge = input.required<Edge<LabeledEdgeData>>();
  label = computed(() => this.edge().data.label ?? '');

  remove() {
    void this.modelService.deleteEdges([this.edge().id]);
  }
}
```

- `ng-diagram-base-edge-label` places and measures the label. `ng-diagram-default-edge-label` (since 1.3.0) only gives the content the default chip look, with hover and selected borders (`--edge-label-border-color-hover`, `--edge-label-border-color-selected`, since 1.3.0).
- `positionOnEdge`: a number `0..1` is relative (0 = source, 1 = target, clamped). A string `'30px'` is measured from the source and `'-20px'` from the target, clamped to the path length (since 1.1.0).
- `[hidden]` (since 1.4.0) hides one label. The label stays in the DOM, keeps its size and never blocks initialization.
- `data-no-pan="true"` / `data-no-drag="true"` on an element or its container stop a drag on it from panning the canvas or dragging nodes. Put them on inputs and buttons.

## Default edge labels

The default edge shows `edge.data.label` (nothing when empty) at `edge.data.positionOnEdge` (default `0.5`; this key since 1.1.0).

```typescript
import { Component, inject } from '@angular/core';
import { NgDiagramModelService, NgDiagramService, type EdgeLabelPosition } from 'ng-diagram';

type DefaultEdgeData = { label?: string; positionOnEdge?: EdgeLabelPosition };

@Component({ selector: 'app-edge-panel', template: '' })
export class EdgePanelComponent {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly diagramService = inject(NgDiagramService);

  async setLabel(edgeId: string, label: string) {
    const edge = this.modelService.getEdgeById<DefaultEdgeData>(edgeId);
    if (!edge) return;
    // updateEdgeData replaces `data` — keep the other keys
    await this.modelService.updateEdgeData(edgeId, { ...edge.data, label, positionOnEdge: '30px' });
  }

  // After a CSS-only change that keeps the label size (class toggle, transform)
  async remeasureLabels(edgeId: string) {
    await this.diagramService.invalidateMeasurements({ edges: [{ edgeId }] });
    return this.modelService.getEdgeById(edgeId)?.measuredLabels; // fresh after the await
  }
}
```

Labels are measured with a `ResizeObserver`, so size changes need nothing. `invalidateMeasurements` exists since 1.2.3 and returns a Promise since 1.3.0.

## Arrowheads and custom markers

The built-in marker id is `'ng-diagram-arrow'`. For your own markers:

```typescript
import { Component } from '@angular/core';
import { NgDiagramMarkerComponent, type Edge } from 'ng-diagram';

// Render <app-markers /> next to <ng-diagram> in the component that has providers: [provideNgDiagram()]
@Component({
  selector: 'app-markers',
  imports: [NgDiagramMarkerComponent],
  template: `
    <ng-diagram-marker>
      <svg>
        <defs>
          <marker id="diamond" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10"
                  orient="auto-start-reverse">
            <path d="M 1 5 L 5 1 L 9 5 L 5 9 Z" fill="context-stroke" stroke="context-stroke" />
          </marker>
        </defs>
      </svg>
    </ng-diagram-marker>
  `,
})
export class MarkersComponent {}

export const edge: Edge = {
  id: 'e1', source: 'a', sourcePort: 'port-right', target: 'b', targetPort: 'port-left',
  sourceArrowhead: 'diamond', targetArrowhead: 'ng-diagram-arrow', data: {},
};
```

- Put one `<marker>` with an `id` in each `<ng-diagram-marker>`: only the first marker inside is registered.
- Render markers inside the component that provides `provideNgDiagram()`, next to `<ng-diagram>`. `<ng-diagram-marker>` needs the diagram's injector.
- `fill="context-stroke"` / `stroke="context-stroke"` make the marker follow the edge color. Safari has no `context-stroke`, so there the library copies each registered marker per edge and replaces `stroke="context-stroke"`, `fill="context-stroke"` and `fill="context-fill"` with the edge color (`stroke="context-fill"` is not replaced). Values inside a `style` attribute are not replaced either, and a plain `<marker>` outside `<ng-diagram-marker>` does not show in Safari.
- `orient="auto-start-reverse"` (as in the built-in arrow) turns the marker with the edge and flips it at the source end, so one id works at both ends. Without `orient` the marker never rotates.

## Edge cases

- Edges drawn by users carry `targetArrowhead: 'ng-diagram-arrow'` in the model (copied from the preview edge). Model data wins, so your `[targetArrowhead]` input is ignored for them unless the builder sets `targetArrowhead: undefined`.
- A relink preview renders your template with the relinked edge's `type`, `data` and labels, plus the `temporary` class. A draw preview uses your template only when `temporaryEdgeDataBuilder` sets `type`.
- The labels of the preview edge (draw or relink) ignore the pointer (since 1.4.0); labels of other edges still catch it. Do the same for other interactive parts of your template: `:host-context(.ng-diagram-edge--temporary) .toolbar { pointer-events: none; }`.
- `[strokeWidth]="0"` and `[strokeOpacity]="0"` are ignored (they fall back to the CSS variable). To hide an edge, use its `hidden` flag (`ng-diagram-visibility`).
- A label stays invisible until the edge has a routed path and the label has a measured position.
- Selected edges show relink handles from `ng-diagram-base-edge` when relinking is on, also in custom templates (`ng-diagram-edge-relinking`).

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| `[ngDiagram] Edge template '<type>' is not registered. Falling back to default edge template.` | The map has no such key, or the map is not bound with `[edgeTemplateMap]`. Make the key and `edge.type` equal. |
| Custom template not used and no warning | The edge has no `type`. For drawn edges set it in `finalEdgeDataBuilder`. |
| Page CSS `--edge-stroke` does not change default edges | Set `--ngd-default-edge-stroke`, `-hover`, `-selected` instead (for example on `ng-diagram`). |
| Default label border ignores `--edge-label-border-color` on hover or selection | Use `--edge-label-border-color-hover` / `--edge-label-border-color-selected` (since 1.3.0). |
| Other `data` keys disappear after a label update | `updateEdgeData` replaces `data`; spread `edge.data`. |
| DI error "No provider for … NgDiagramBaseEdgeComponent" | A label component is outside `<ng-diagram-base-edge>`. Move it inside. |
| DI error "No provider for … MarkerRegistryService" | `<ng-diagram-marker>` is outside the `provideNgDiagram()` component. Render it next to `<ng-diagram>`. |
| `[ngDiagram] Marker element not found in projected content` | No `<marker>` inside `<ng-diagram-marker>`. |
| `[ngDiagram] Marker element must have an id attribute` | Add an `id` and use it in `sourceArrowhead`/`targetArrowhead`. |
| Arrowhead missing only in Safari | Wrap the marker in `<ng-diagram-marker>`; use `fill`/`stroke` attributes, not `style`, and not `stroke="context-fill"`. |
| Arrowhead points the wrong way | Add `orient="auto-start-reverse"` (or `orient="auto"`). |
| Typing or dragging in a label input pans the canvas | Add `data-no-pan="true"` and `data-no-drag="true"`. |
| Label misplaced after a CSS-only change | `await invalidateMeasurements({ edges: [{ edgeId }] })`. |
| Cursor flickers while drawing over edge content | Fixed in 1.4.0 for labels — upgrade; use the `ng-diagram-edge--temporary` rule for other content. |
| Labels missing after loading a new model or a model with saved `points` | Fixed in 1.1.0 — upgrade. |
| Labels not measured after an edge is removed and added again with the same id | Fixed in 1.2.3 — upgrade. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
