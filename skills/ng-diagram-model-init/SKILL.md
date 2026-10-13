---
name: ng-diagram-model-init
description: Use when creating, loading or swapping an ng-diagram model (initializeModel), waiting for diagramInit/isInitialized, edits lost after a model swap or @if/tab switch, or "Library engine not initialized yet", NG0203, "Measurement timeout reached".
license: Apache-2.0
---

# ng-diagram model initialization

Create models with `initializeModel`, load and switch them, know when service calls work, wait for initialization, and fix init-time warnings. Save/load format and custom adapters: `ng-diagram-persistence`. Model fields: `ng-diagram-fundamentals` (`references/model-reference.md`).

## Rules

- **Create every model with `initializeModel(data?, injector?, options?)`**, or `initializeModelAdapter(adapter, data?, injector?, options?)` for your own `ModelAdapter` (since 1.1.0). They strip stale runtime fields and add internal ids; an adapter that skips this step can block measurement at init.
- **Pass an `Injector` outside an injection context:** after an `await`, in event handlers and timers, and inside `computed`, `effect` and `linkedSignal`. Field initializers and constructors need none. Without it Angular throws NG0203 (`effect() can only be used within an injection context ...`).
- **A new model object means a full re-initialization:** the engine is destroyed and created again (from the current `[config]`), every element is measured again, `isInitialized()` goes `false` and back to `true`, and `(diagramInit)` fires again. Binding the same object again does nothing.
- **Service methods throw `[ngDiagram] Library engine not initialized yet.` until `<ng-diagram>` has created its engine**, for example in the constructor or `ngOnInit` of the component that renders it, or of a toolbar or sidebar declared next to `<ng-diagram>` in the same template. Start your logic from `(diagramInit)` or an `isInitialized()` effect.
- **Calls right after you assign a new model reach the old one.** The swap happens on the next change detection, and the old model is then thrown away with your changes. Put the data into `initializeModel(...)`, or make the calls in `(diagramInit)`.
- **A model belongs to one diagram instance.** When `<ng-diagram>` is destroyed or gets another model, the old adapter is destroyed: the default adapter clears its nodes and edges and stops notifying. Create a new model each time the diagram is created again (an `@if`, a tab, a route), from content you saved before the switch (recipe below).

## Lifecycle

1. `<ng-diagram>` renders and creates the engine from `[model]`, `[config]` and `[middlewares]`. Service methods work from here, but nothing is measured yet.
2. Nodes, ports and labels render on a hidden canvas; a `ResizeObserver` measures them.
3. When every visible element is measured, the init pass runs (edge routing, z-index) and the engine emits `diagramInit`.
4. Then `isInitialized()` becomes `true`, the `(diagramInit)` output fires, `zoom.zoomToFit.onInit` runs if enabled, and the canvas becomes visible.

The `nodes()`, `edges()` and `metadata()` signals of `NgDiagramModelService` start updating only after step 4.

## Static model, react to init

```typescript
@Component({
  selector: 'app-diagram',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `<ng-diagram [model]="model" (diagramInit)="onDiagramInit($event)" />`,
  styles: `:host { display: flex; height: 100%; }`,
})
export class DiagramComponent {
  private readonly viewport = inject(NgDiagramViewportService);

  // Field initializer = injection context, so no injector is needed here
  model = initializeModel({
    nodes: [
      { id: 'a', position: { x: 0, y: 0 }, data: { label: 'A' } },
      { id: 'b', position: { x: 300, y: 0 }, data: { label: 'B' } },
    ],
    edges: [{ id: 'a-b', source: 'a', sourcePort: 'port-right', target: 'b', targetPort: 'port-left', data: {} }],
  });

  async onDiagramInit(event: DiagramInitEvent): Promise<void> {
    console.log(event.nodes.map((node) => node.size)); // measured sizes are available here
    await this.viewport.zoomToFit({ padding: 40 });
  }
}
```

To fit on every load without code, set `zoom: { zoomToFit: { onInit: true } }` in `[config]` (not with virtualization, see Edge cases).

## Load from an API or switch diagrams

```typescript
@Component({
  selector: 'app-diagram-page',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <ng-diagram [model]="model()" />
    @if (!ready()) {
      <div class="loading">Loading…</div>
    }
  `,
  styles: `:host { display: flex; height: 100%; position: relative; }`,
})
export class DiagramPageComponent {
  private readonly injector = inject(Injector);
  private readonly api = inject(DiagramApi); // your data service
  readonly ready = inject(NgDiagramService).isInitialized; // false again during every re-init

  readonly model = signal(initializeModel());
  private currentId: string | null = null;

  async open(id: string): Promise<void> {
    if (id === this.currentId) return; // every new model means a full re-initialization
    this.currentId = id;
    const data = await this.api.load(id);
    // after an await there is no injection context: pass the injector
    this.model.set(initializeModel(data, this.injector));
  }
}
```

- A signal keeps the swap visible to `OnPush` and zoneless components.
- Work that must follow each load (layout, selection, focus) belongs in `(diagramInit)`, which fires after every initialization.

## Keep the content when the diagram leaves and comes back

When an `@if`, a tab or a route removes `<ng-diagram>`, its model is destroyed and emptied. Save the content while `<ng-diagram>` still exists, for example in the handler that switches the tab, and create the next model from it. `ngOnDestroy` of the component that renders `<ng-diagram>` is too late: Angular destroys `<ng-diagram>` first, so service calls throw and the default model is already empty. Content that must survive any teardown (a route change) belongs in your own store (`ng-diagram-persistence`).

```typescript
@Component({
  selector: 'app-editor-tabs',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <button (click)="show('diagram')">Diagram</button>
    <button (click)="show('table')">Table</button>
    @if (tab() === 'diagram') {
      <div class="canvas"><ng-diagram [model]="model()" /></div>
    }
  `,
  styles: `.canvas { display: flex; height: 500px; }`,
})
export class EditorTabsComponent {
  private readonly injector = inject(Injector);
  private readonly modelService = inject(NgDiagramModelService);
  readonly tab = signal<'diagram' | 'table'>('diagram');
  readonly model = signal(initializeModel());
  private saved: Partial<Model> = {};

  show(tab: 'diagram' | 'table'): void {
    if (tab === this.tab()) return;
    if (this.tab() === 'diagram') {
      // <ng-diagram> still exists here; in ngOnDestroy it is already destroyed and its model is empty
      this.saved = JSON.parse(this.modelService.toJSON()) as Partial<Model>;
    } else {
      // no <ng-diagram> exists now: give the next one a fresh model
      this.model.set(initializeModel(this.saved, this.injector));
    }
    this.tab.set(tab);
  }
}
```

## Reactive model from a signal (since 1.2.0)

```typescript
private readonly injector = inject(Injector);
readonly diagramData = signal<Partial<Model>>({});
// computed is not an injection context: the injector is required
readonly model = computed(() => initializeModel(this.diagramData(), this.injector));
```

Every new `diagramData` value is a full re-initialization; setting the same object again is skipped. Do not feed sources that change often: apply small changes with `NgDiagramModelService` instead (`ng-diagram-state-updates`). Before 1.2.0, `initializeModel` inside `computed` threw NG0602.

## Wait for init in another component

```typescript
@Component({
  selector: 'app-outline',
  template: `@for (node of nodes(); track node.id) { <div>{{ node.id }}</div> }`,
})
export class OutlineComponent {
  private readonly diagram = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly selection = inject(NgDiagramSelectionService);
  readonly nodes = this.modelService.nodes; // [] until the diagram is initialized

  constructor() {
    // Runs after the first init and again after every re-init (new model)
    effect(() => {
      if (this.diagram.isInitialized()) {
        untracked(() => this.selectFirstNode());
      }
    });
  }

  private selectFirstNode(): void {
    const first = this.modelService.getModel().getNodes()[0]; // service calls are safe now
    if (first) void this.selection.select([first.id]);
  }
}
```

The three ways to wait:

- `(diagramInit)` on `<ng-diagram>`: fires after every initialization and survives model swaps.
- `isInitialized()` from `NgDiagramService`: a signal for templates and effects, in any component under the same `provideNgDiagram()`.
- `addEventListenerOnce('diagramInit', callback)`: registers on the current engine only. It throws before the engine exists, and a listener added just before a model swap dies with the old engine. Inside it, `isInitialized()` is still `false`. Prefer the two above.

## Keep runtime fields from saved data (since 1.3.0)

`initializeModel()` removes runtime fields from every element: on nodes `selected`, `measuredPorts`, `measuredBounds`, `computedZIndex`, `computedHidden`; on edges `measuredLabels`, `computedZIndex`, `computedHidden` and `sourcePosition`/`targetPosition` of connected ends. `InitializeModelOptions` replaces these strip functions, at your own risk: wrap the default and add back only what you need.

```typescript
// At your own risk: keep node selection from saved data (stripped by default)
model = initializeModel(savedData, undefined, {
  stripNodeRuntimeProperties: (node) => ({ ...stripNodeRuntimeProperties(node), selected: node.selected }),
});
```

Keeping measured fields (`measuredPorts`, `measuredLabels`, ...) makes the library skip fresh measurement and breaks the diagram. For the default model the same functions also run in `toJSON()`.

## Measurement timeout at init

Initialization waits until every visible node, port and label has a real size (width and height above 0). Elements that never get one keep the canvas hidden until 2-second safety timeouts expire, and the console shows:

- `[InitUpdater] Measurement timeout reached. Some entities may not be measurable (e.g., display: none). ...` with `{ nodes: { expected, measured }, ports: ..., labels: ... }`. Init is then forced to finish.
- `[DiagramInitEmitter] Measurement timeout reached from last measurement. Emitting diagramInit event anyway. ...`, then `Total unmeasured elements: N` and lists such as `Unmeasured nodes (2): ['a', 'b']` or `Unmeasured node ports (1): ['a:port-left']`. This one fires 2 s after the last measurement progress, so a broken load can take about 4 s.

Causes and fixes:

| Cause | Fix |
| --- | --- |
| Nodes, ports or labels hidden with CSS `display: none` | Use the `hidden` flag on nodes and edges or the `hidden` input on ports and labels (since 1.4.0); hidden elements create no measurement expectations. See `ng-diagram-visibility`. |
| `<ng-diagram>` inside a hidden container (inactive tab, collapsed panel, `display: none` parent) | Create the diagram component, with a new model, only when the container is visible (`@if`). |
| A custom `ModelAdapter` bound without `initializeModelAdapter()` | Pass it through `initializeModelAdapter(adapter, data?, injector?)` first. |
| A node, port or label element in your template renders with zero width or height | Give it a size (`ng-diagram-custom-nodes`, `ng-diagram-ports`, `ng-diagram-custom-edges`). |

A rare `[ngDiagram] Initialization stabilization failed.` (console error) also forces init to finish; the message lists the same causes.

## Edge cases

- In the `(diagramInit)` handler the `nodes()`, `edges()`, `selection()` and `config()` signals are not updated yet (empty, or `{}` for `config()`, on the first init; the previous model's values after a swap): read `event.nodes`, `getModel()` or the getters.
- During a re-initialization, `nodes()` and `edges()` keep showing the previous model until `isInitialized()` is `true` again.
- A new model drops runtime registrations made on the old engine: `updateConfig()` changes, `registerMiddleware()`, `registerRouting()` and `setDefaultRouting()`, `addEventListener()` listeners and `setEventsEnabled(false)`. Template outputs and the `[config]`/`[middlewares]` inputs carry over. Re-apply the rest in `(diagramInit)`.
- `setEventsEnabled(false)` or `removeAllEventListeners()` before `diagramInit` keeps the canvas hidden and `(diagramInit)` silent: the diagram itself listens to that event.
- Before init, signals are safe to read and return empty or default values: `nodes()`, `edges()`, `metadata()`, `selection()`, `viewport()`, `isInitialized()`, `config()` (`{}`). `NgDiagramViewportService.canZoomIn()` and `canZoomOut()` read the zoom config and throw until the engine exists.
- `invalidateMeasurements()` resolves at once, doing nothing, when no element is rendered yet. `zoomToFit()` (also `zoom.zoomToFit.onInit`) does nothing while the content has no measured bounds, the diagram has no size, or virtualization is on (it logs `[ngDiagram] zoomToFit is disabled when virtualization is enabled.`, see `ng-diagram-viewport`); call it from `(diagramInit)`.
- An empty model initializes too: `diagramInit` fires with empty lists.
- With virtualization, initialization waits only for the elements rendered at that time, and `event.nodes`/`event.edges` list only those.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| `[ngDiagram] Library engine not initialized yet.` | Service method called before the engine exists (constructor or `ngOnInit` of the host, or after `<ng-diagram>` was destroyed): move it to `(diagramInit)` or an `isInitialized()` effect. |
| NG0203 `effect() can only be used within an injection context` from `initializeModel` | Called after `await` or in `computed`/`effect`: pass the injector. |
| NG0602 from `initializeModel` inside `computed`/`effect` | Before 1.2.0: upgrade, and pass the injector. |
| Nodes added right after loading a new model disappear | They went to the old model: include them in the data or add them in `(diagramInit)`. |
| `(diagramInit)` does not fire after "reloading" | Same model object bound again, `<ng-diagram>` not rendered, or events disabled before init. |
| Diagram empty or frozen after an `@if`, tab or route brings it back | The old model was destroyed with the diagram: save the content before the switch and create a new model from it (recipe above). |
| `toJSON()` throws or returns no nodes in `ngOnDestroy` of the host | `<ng-diagram>` is destroyed before its host: save earlier, in the handler that triggers the switch. |
| Diagram appears after 2 to 4 s with `Measurement timeout reached` warnings | Unmeasurable elements: see the table above. |
| `nodes()` is `[]` or stale in the `(diagramInit)` handler | The signals update later: use `event.nodes`. |
| Settings set with `updateConfig()` are reset after loading another model | The new engine starts from `[config]`: keep `[config]` in sync (`ng-diagram-config`). |
| Init logic runs again on every load | `(diagramInit)` and `isInitialized()` effects run after every init: guard one-time work with a flag. |
| Edge labels disappear after re-initialization | Fixed in 1.1.0: upgrade. |
| An error in a custom adapter during init leaves nothing measured | Fixed in 1.3.0 (init completes and logs `[ngDiagram] Initialization completion failed — continuing initialization.`): upgrade. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
