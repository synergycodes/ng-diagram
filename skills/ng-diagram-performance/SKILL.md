---
name: ng-diagram-performance
description: Use when an ng-diagram is slow or large - hundreds or thousands of nodes, laggy drag, pan or zoom, slow bulk updates - or when enabling or tuning virtualization (padding, idleDelay), batching updates or lightening node templates.
license: Apache-2.0
---

# Performance and virtualization

How to keep large ng-diagram editors fast: virtualization, batching, cheap templates, minimap settings, measuring. Viewport fitting is in `ng-diagram-viewport`, transactions in detail in `ng-diagram-transactions`, hiding elements in `ng-diagram-visibility`, the minimap in `ng-diagram-minimap`.

Without virtualization the library is built for hundreds of nodes: the docs performance test renders 500 default nodes in a 25 × 20 grid with 499 edges. For more, turn on virtualization.

## Rules

- Batch changes. Every service call is one full update pass: all middlewares (yours too), edge routing, z-index and events. Send one `updateNodes([...])` for many nodes, and wrap different operations in one `transaction`.
- Keep one model. A new model object (for example `computed(() => initializeModel(data(), injector))` fed by changing data) re-initializes the whole diagram: every element is measured again and `diagramInit` fires again. Update the existing model with the services; use `initializeModel` to load a different diagram.
- Virtualization (since 1.0.0) is chosen when the model initializes. Put it in `[config]` before init. To switch it, change `[config]` and initialize the model again (`[config]` alone is read only at model init). Do not switch `virtualization.enabled` with `updateConfig`: it only flips the flag, so the render strategy and the pan handler chosen at init stay, while code that checks the flag later (`zoomToFit`, `[ngDiagramHidden]`, port cleanup) switches. The diagram ends up half in each mode.
- Hide many elements with one `updateNodes` call that sets the model `hidden` flag (since 1.4.0). Under virtualization the `[ngDiagramHidden]` template binding (since 1.4.0) is ignored.
- Keep node templates cheap: `ChangeDetectionStrategy.OnPush`, derived values in `computed`, no heavy work in template expressions. Only a node whose properties really change gets a new object, so the templates of the other nodes keep the same input (with OnPush, Angular skips them).
- Do not put heavy `computed`s on `modelService.nodes()`/`edges()` in always-visible UI: these signals change on every node change, for example on every frame of a drag.

## Enable virtualization

```typescript
readonly config = signal<NgDiagramConfig>({
  virtualization: {
    enabled: true, // default false
    padding: 0.5, // default 0.5 - extra render area around the visible viewport
    idleDelay: 100, // default 100 ms - wait after panning stops before rendering newly visible elements
  },
});
readonly model = signal(initializeModel(bigData));

// `enabled` is read when the model initializes: change the config AND re-initialize from plain data
setVirtualization(enabled: boolean): void {
  const data: Partial<Model> = JSON.parse(this.modelService.toJSON()); // keeps size, points, metadata.viewport
  this.config.update((config) => ({ ...config, virtualization: { ...config.virtualization, enabled } }));
  this.model.set(initializeModel(data, this.injector)); // outside an injection context: pass the injector
}
```

Template: `<ng-diagram [model]="model()" [config]="config()" />`. Re-initializing passes plain data: `initializeModel(modelService.getModel())` does not compile (the adapter is not `Partial<Model>`).

- `padding`: the render area grows on each side by `max(viewport width, height) × padding` screen px. When zoomed out (scale < 1) this extra area shrinks in proportion to the scale.
- `idleDelay`: while the user pans, the rendered set stays the same; `idleDelay` ms after panning stops, newly visible elements are added. During zoom the set is refreshed 300 ms after the last scale change. Fast pans can show empty areas for a moment: raise `padding` (more DOM) or lower `idleDelay` (more renders).
- `padding` and `idleDelay` are read on every use, so `updateConfig({ virtualization: { padding: 1 } })` works at runtime. `enabled` does not.

## What changes with virtualization

| Area | Behavior |
| --- | --- |
| DOM | Only nodes in the render area, children of rendered groups, edges of rendered nodes (plus their other end node) and dangling edges crossing the area. Hidden elements are removed from the DOM instead of `display: none`. |
| Measurement | `diagramInit` waits only for the elements rendered at start, and its `nodes`/`edges` list only those (read the whole model with `getModel()`). Other nodes are measured the first time they are rendered; until then they have only the `size` in your data. |
| `zoomToFit()` | Disabled, including `zoom.zoomToFit.onInit`: logs `[ngDiagram] zoomToFit is disabled when virtualization is enabled.` Use the custom fit in `ng-diagram-viewport`. |
| `[ngDiagramHidden]` | Ignored, with a warning per binding: `[ngDiagram] ngDiagramHidden is not supported with virtualization enabled and is ignored — …`. Use the model `hidden` flag. |
| Minimap | Shows only the viewport frame and the outline of the diagram (from `position` + `size`), no nodes. |
| Panning | Pointer pans are applied once per animation frame. |
| Image export | A DOM capture contains only rendered elements (see `ng-diagram-export`). |

Give nodes a `size` in your data (or keep the one `toJSON()` saves): never-rendered nodes then have real bounds for the render-area test (without a size a node counts as 1 × 1 px at its position), the minimap outline, layouts and custom fits.

## Batch updates

```typescript
// Slow: one full update pass (middlewares, routing, events) per node
async moveOneByOne(positions: Map<string, Point>): Promise<void> {
  for (const [id, position] of positions) {
    await this.modelService.updateNode(id, { position });
  }
}

// Fast: one pass for all nodes
async moveAll(positions: Map<string, Point>): Promise<void> {
  await this.modelService.updateNodes([...positions].map(([id, position]) => ({ id, position })));
}

// Different operations: one transaction = one commit
async importChunk(newNodes: Node[], newEdges: Edge[], obsoleteEdgeIds: string[]): Promise<void> {
  await this.diagram.transaction(() => {
    this.modelService.deleteEdges(obsoleteEdgeIds); // do not reuse these ids below: adds run before removes
    this.modelService.addNodes(newNodes);
    this.modelService.addEdges(newEdges);
  });
}
```

A property set to the value it already has is not a change (positions and sizes are compared by value, other properties by reference), so a node whose `data` gets a new object always counts as changed.

## Cheap node templates

```typescript
@Component({
  selector: 'app-task-node',
  imports: [NgDiagramPortComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="task">
      <span>{{ node().data.title }}</span>
      <span>{{ percent() }}</span>
    </div>
    <ng-diagram-port id="in" type="target" side="left" />
    <ng-diagram-port id="out" type="source" side="right" />
  `,
})
export class TaskNodeComponent implements NgDiagramNodeTemplate<TaskData> {
  node = input.required<Node<TaskData>>();
  // Derived values as computed signals: recalculated only when this node changes
  readonly percent = computed(() => `${Math.round(this.node().data.progress * 100)}%`);
}
```

- Level of detail: when zoomed out, render a lighter variant, e.g. `computed(() => viewport.scale() < 0.75)` switching the template content (the Org Chart template does this). If the variant has another size, the node is measured again.
- Minimap on large diagrams: `<ng-diagram-minimap [deferNodeUpdates]="true" />` (since 1.2.0) freezes minimap nodes during drag, resize and rotate. Prefer `nodeStyle` or CSS over `minimapNodeTemplateMap`, which renders Angular components in `foreignObject` per node.
- Box selection on very large diagrams: `boxSelection: { realtime: false }` selects once on release instead of running one update pass per pointer move.

## Measure

- `debugMode: true` (in `[config]` or `updateConfig`) logs `[ngDiagram] Render: +<added> -<removed> nodes (total: <n>): <ms>ms` whenever the set of rendered nodes changes (time from the render call until two animation frames later), and logs every update with its full before/after state. The state logs are heavy on big diagrams: use them to see what runs, turn them off when you time things, and never ship them.
- For real numbers, record a drag or pan in the browser's performance profiler and look for long scripting tasks in your own templates and middlewares.

## Edge cases

- Switching virtualization re-initializes the diagram: node selection is cleared (`toJSON()` drops node `selected` but keeps edge `selected`), `diagramInit` fires again, and `zoom.zoomToFit.onInit` runs again (with virtualization on, it only logs the warning).
- Your middlewares run on every update pass, including each drag frame. Return early (`next()`) when the update does not concern them; never `await` service calls inside a middleware (see `ng-diagram-middleware`).
- While the user pans, viewport updates skip the middleware chain, so middlewares cost nothing during pans.
- Many template `[ngDiagramHidden]` bindings changing in one change detection cycle are processed together, but the model flag is still cheaper.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Slow bulk import or layout apply | One call per element: use `updateNodes`/`addNodes` with arrays, or one `transaction` |
| Every data change re-measures everything and fires `diagramInit` | The model is re-created (reactive `initializeModel`): keep one model, update it with services |
| Changing `virtualization.enabled` at runtime does nothing (`[config]`) or leaves the diagram half switched (`updateConfig`) | Init-only: change `[config]` and re-initialize the model from `JSON.parse(toJSON())` |
| `[ngDiagram] zoomToFit is disabled when virtualization is enabled.` | Expected; fit with `setViewport` and your own bounds (`ng-diagram-viewport`) |
| `[ngDiagram] ngDiagramHidden is not supported with virtualization enabled …` | Use the model `hidden` flag (`updateNodes([{ id, hidden: true }])`) |
| Empty areas flash while panning | Virtualization renders after panning stops: raise `padding` or lower `idleDelay` |
| Minimap shows no nodes | Expected with virtualization (frame and outline only) |
| Minimap slows down drag | `[deferNodeUpdates]="true"`, no `minimapNodeTemplateMap` |
| Exported image misses parts of a large diagram | Virtualization: only rendered elements are in the DOM; see `ng-diagram-export` |
| Console flooded with `[ngDiagram] <action>` logs, everything slow | `debugMode: true` is on: turn it off |
| Lag while dragging | Heavy templates or middlewares run every frame: OnPush + `computed`, early-return middlewares |
| With virtualization, edges point to old port positions or labels are missing after fast panning | Fixed in 1.3.0: upgrade |
| Adding or updating many nodes at once is slow (layout thrashing) | Improved in 1.2.2 (batched measurement): upgrade |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
