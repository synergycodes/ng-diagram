---
name: ng-diagram-fundamentals
description: Use when starting any ng-diagram task or unsure how the library works - data flow, golden rules, system-owned node/edge fields, where NgDiagram services can be injected, and which ng-diagram skill to load next.
license: Apache-2.0
---

# ng-diagram fundamentals

How ng-diagram works, the rules that prevent most bugs, and where to look next. The skill map at the end names the skill that owns each topic.

## Rules

- **Import the styles globally.** `@import 'ng-diagram/styles.css';` goes in the global stylesheet (`src/styles.css` or `.scss`), never in a component's `styles`. The library is styled through CSS variables on `:root`, and component styles are scoped. See `ng-diagram-setup`.
- **One `provideNgDiagram()` per diagram.** Put it in `providers` of the component that renders `<ng-diagram>`, or of an ancestor that also renders your toolbar or sidebar. Services resolve to the nearest registration, so two diagrams under one registration fight over one engine.
- **Change the model only through the services** (`NgDiagramModelService`, `NgDiagramSelectionService`, `NgDiagramNodeService`, ...). Do not mutate node or edge objects or write to the adapter from `getModel()`: only the services run middlewares, routing, z-index and events.
- **`await` when the next line depends on the change**, otherwise `void` the promise. Never `await` a service call inside a middleware: the update pipeline is not re-entrant and the await deadlocks (see `ng-diagram-middleware`).
- **Never write system-owned fields:** `measuredPorts`, `measuredBounds`, `measuredLabels`, `computedZIndex`, `computedHidden`, `sourcePosition`/`targetPosition` of connected edge ends, `points` of auto-routed edges, `size` of auto-sized nodes. The library recomputes them and your value is lost. Read `references/model-reference.md` when you need to know who owns a property.
- **Wait for initialization** before working with a new model: use `(diagramInit)` or `isInitialized()`. Calls made right after you assign a new model still reach the old model and are lost.
- **Hide elements with the `hidden` flag (since 1.4.0), not CSS `display: none`.** CSS-hidden elements cannot be measured, so loading waits for the measurement timeout and logs warnings. See `ng-diagram-visibility`.
- **Create every model with `initializeModel()`** (pass a custom adapter through `initializeModelAdapter()`), and give each diagram instance its own model. The adapter is destroyed together with its diagram.

## How it works

```
your code ──► NgDiagram*Service method ──┐
user gesture (drag, draw, keys) ─────────┤
                                         ▼
            command (one operation: addNodes, moveNodesBy, paste, ...)
                                         ▼
   middleware chain: your middlewares + built-ins (internal ids, z-index, edge routing)
                                         ▼
   model (the ModelAdapter from initializeModel) ──► events: (selectionChanged), addEventListener, ...
                                         ▼
               Angular renders nodes, edges, ports and labels
                                         ▼
   ResizeObserver measures nodes, ports and edge labels; the results go back through
   the same pipeline as size / measuredPorts / measuredLabels, and edges re-route
```

- Each `<ng-diagram>` has one engine. It is created when `<ng-diagram>` first renders and created again when you bind a new model. Before that, service methods throw `[ngDiagram] Library engine not initialized yet.`
- Initialization ends when all visible elements are measured. Then `(diagramInit)` fires and `NgDiagramService.isInitialized()` becomes `true`; the canvas stays invisible until then. See `ng-diagram-model-init`.
- Events fire after a change is committed to the model.
- Since 1.3.0 every mutating method of `NgDiagramModelService`, `NgDiagramNodeService`, `NgDiagramSelectionService`, `NgDiagramClipboardService`, `NgDiagramGroupsService` and `NgDiagramViewportService` returns a promise that resolves when the change is in the model (`attachEdge` resolves to a `boolean`). `NgDiagramService` setters such as `updateConfig()` and `registerRouting()` are synchronous. After `await`, getters (`getNodeById()`, `getModel().getNodes()`) are fresh. The `nodes()`, `edges()` and `metadata()` signals update with change detection and can lag behind.

## Check the installed version and verify APIs

```bash
npm ls ng-diagram                     # or read "version" in node_modules/ng-diagram/package.json
grep -n "startLinkingFromPosition" node_modules/ng-diagram/ng-diagram.d.ts
grep -n "@since 1.4.0" node_modules/ng-diagram/ng-diagram.d.ts
grep -n "ɵɵComponentDeclaration<NgDiagramComponent" node_modules/ng-diagram/ng-diagram.d.ts
```

- `ng-diagram.d.ts` holds the whole public API in one file, with TSDoc and `@since` tags.
- Component selectors and input/output names are in the `ɵɵComponentDeclaration<...>` and `ɵɵDirectiveDeclaration<...>` lines.
- Members tagged `@internal` can change without notice; build on `@public` APIs (https://www.ngdiagram.dev/docs/policies/api-stability/).
- The docs MCP server answers from docs bundled in its own npm package, which can be newer than your installed version. Check `@since` before you use an API it suggests.
- Examples in these skills assume Angular 19+, where components are standalone by default. On Angular 18 add `standalone: true` to every component and directive from these examples, including those without `imports`: Angular 18 does not make them standalone by default, so `imports` reports `'imports' is only valid on a component that is standalone.` and a non-standalone component cannot be listed in another component's `imports`.

## Coordinates

- **Flow coordinates** are what the model stores. `node.position` is the node's top-left corner; units are pixels at zoom 1.
- **Group children keep global flow coordinates.** Moving a group moves its children, but a child's `position` is never relative to the group.
- **Port geometry is relative to its node:** `measuredPorts[i].position` is measured from the node's `position`.
- **Client coordinates** come from DOM events (`clientX`, `clientY`). Convert them with `NgDiagramViewportService.clientToFlowPosition()` and back with `flowToClientPosition()`. With viewport `{ x, y, scale }`, a flow point `p` is drawn at `p * scale + (x, y)` from the top-left corner of `<ng-diagram>`.
- APIs that take a position for content (`addNodes`, `paste(position)`, `startLinkingFromPosition`) expect flow coordinates.

```typescript
private readonly modelService = inject(NgDiagramModelService);
private readonly viewport = inject(NgDiagramViewportService);

async addNodeAt(event: MouseEvent): Promise<void> {
  // client (screen) pixels -> flow (model) coordinates
  const position = this.viewport.clientToFlowPosition({ x: event.clientX, y: event.clientY });
  // crypto.randomUUID needs HTTPS or localhost; use your own id helper otherwise
  await this.modelService.addNodes([{ id: crypto.randomUUID(), position, data: { label: 'New' } }], {
    waitForMeasurements: true, // resolve after the new node has a measured size
  });
  await this.viewport.zoomToFit(); // safe: the node is in the model and measured
}
```

Viewport API details: `ng-diagram-viewport`.

## Where services can be injected

All `NgDiagram*Service` classes come from `provideNgDiagram()`. You can inject them in:

- the component that lists `provideNgDiagram()` in `providers` (in its own class too),
- every component and directive in its template: toolbars, sidebars, the minimap, palettes,
- your node and edge template components (they render inside `<ng-diagram>`),
- your own `@Injectable()` services listed in the same `providers` array.

Code outside that tree (a `providedIn: 'root'` service, a component not rendered inside the host's template, an overlay created with a root injector) gets `NullInjectorError: No provider for NgDiagram...Service!`. For a dialog opened from inside the diagram (node editor, context menu), pass the caller's injector: Angular CDK and Material dialogs accept `{ injector: this.injector }` or `{ viewContainerRef: this.viewContainerRef }`. Otherwise move `provideNgDiagram()` up to a common ancestor, or make the service diagram-scoped:

```typescript
// Diagram-scoped helper: @Injectable() without providedIn, listed next to provideNgDiagram()
@Injectable()
export class DiagramActions {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly selection = inject(NgDiagramSelectionService).selection;

  async renameSelected(label: string): Promise<void> {
    const node = this.selection().nodes[0];
    if (node) {
      await this.modelService.updateNodeData(node.id, { ...node.data, label });
    }
  }
}

@Component({
  selector: 'app-sidebar',
  template: `
    @if (selectedNode(); as node) {
      <input #label [value]="node.id" />
      <button (click)="actions.renameSelected(label.value)">Rename</button>
    }
  `,
})
export class SidebarComponent {
  protected readonly actions = inject(DiagramActions);
  private readonly selection = inject(NgDiagramSelectionService).selection;
  protected readonly selectedNode = computed(() => this.selection().nodes[0]);
}

@Component({
  selector: 'app-editor',
  imports: [NgDiagramComponent, SidebarComponent],
  providers: [provideNgDiagram(), DiagramActions], // one scope for the diagram and its UI
  template: `
    <div class="canvas"><ng-diagram [model]="model" /></div>
    <app-sidebar />
  `,
  styles: `
    :host { display: flex; height: 100vh; }
    .canvas { flex: 1; display: flex; }
  `,
})
export class EditorComponent {
  model = initializeModel({ nodes: [{ id: 'a', position: { x: 0, y: 0 }, data: { label: 'A' } }] });
}
```

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Diagram blank, unstyled or zero-height | Styles or container size: see `ng-diagram-setup`. |
| ``NgDiagram services are not available. Please register all required services using `provideNgDiagram()` ...`` | No registration above `<ng-diagram>`: see `ng-diagram-setup`. |
| `NullInjectorError: No provider for NgDiagramModelService!` in a toolbar, sidebar or service | Code outside the `provideNgDiagram()` tree: move the provider up or use a diagram-scoped `@Injectable()` (above). |
| `[ngDiagram] Library engine not initialized yet.` | Service method called before `<ng-diagram>` created its engine: see `ng-diagram-model-init`. |
| Changes made right after `initializeModel(...)` disappear | They reached the old model: see `ng-diagram-model-init`. |
| A value you set (`measuredPorts`, `computedZIndex`, `sourcePosition`, auto `points`) is overwritten | System-owned field: see `references/model-reference.md`. |
| `nodes()` shows the old state right after `await` | Signals lag: read with getters, see `ng-diagram-state-updates`. |
| Changing the object bound to `[config]` does nothing | Config is read when the engine is created: see `ng-diagram-config`. |
| Loading takes 2 s or more and logs `[InitUpdater] Measurement timeout reached` | Unmeasurable elements: see `ng-diagram-model-init` and `ng-diagram-visibility`. |

## Skill map

| Skill | Use when |
| --- | --- |
| `ng-diagram-fundamentals` | You need the big picture, the golden rules, field ownership, coordinates or injection scope. |
| `ng-diagram-setup` | Installing, global styles, `provideNgDiagram`, container size, `[tabbable]`, watermark, several diagrams, Angular versions, starter templates, docs MCP. |
| `ng-diagram-model-init` | Creating, loading or switching models, waiting for `diagramInit`/`isInitialized`, init errors and measurement timeouts. |
| `ng-diagram-config` | `[config]` vs `updateConfig()`, defaults of every config key, custom ids, edge panning, viewer flags, `debugMode`. |
| `ng-diagram-state-updates` | Adding, updating, deleting and querying nodes and edges, typed `data`, reading state after `await`. |
| `ng-diagram-transactions` | Batching several changes into one update, async transactions, waiting for measurements. |
| `ng-diagram-persistence` | Saving and loading, what `toJSON()` keeps, custom `ModelAdapter`, undo/redo. |
| `ng-diagram-middleware` | Validating, changing or blocking model changes, read-only mode. |
| `ng-diagram-custom-nodes` | Node templates, default node options, `autoSize` vs `size`, interactive content, `draggable`. |
| `ng-diagram-ports` | Ports, custom port content, port measurement, hidden or removed ports. |
| `ng-diagram-resize-rotate-snap` | Resize and rotate handles, snapping, programmatic resize, rotate and move. |
| `ng-diagram-groups` | Group nodes, membership, group templates, deleting groups. |
| `ng-diagram-visibility` | `hidden` flag, expand/collapse, filtering, why not CSS `display: none`. |
| `ng-diagram-custom-edges` | Edge templates, labels, arrowheads, edge CSS classes. |
| `ng-diagram-edge-routing` | Built-in routings, `routingMode`, manual points, custom routing. |
| `ng-diagram-linking` | Drawing edges between ports, `validateConnection`, edge builders, floating edges, programmatic linking. |
| `ng-diagram-edge-relinking` | Letting users drag an edge end to another port. |
| `ng-diagram-dangling-edges` | Edges with free ends, keeping edges when their node is deleted, `startLinkingFromPosition`, `attachEdge`/`detachEdge`. |
| `ng-diagram-events` | Event names and payloads, listeners, turning events off. |
| `ng-diagram-selection-clipboard` | Selection API, context menus, property panels, box selection, copy/cut/paste. |
| `ng-diagram-shortcuts` | Keyboard shortcuts, Escape/cancel, keyboard move and pan, focus and Tab order. |
| `ng-diagram-touch` | Touch gestures and mobile UX. |
| `ng-diagram-palette` | Drag-and-drop palette, item previews, the drop event. |
| `ng-diagram-viewport` | Pan and zoom API, `zoomToFit`, centering, coordinate conversion, panning switches, saving and restoring the view. |
| `ng-diagram-export` | Exporting the diagram as PNG, JPEG or SVG. |
| `ng-diagram-performance` | Large diagrams, virtualization, batching, minimap cost. |
| `ng-diagram-auto-layout` | ELK or dagre layouts, tree layouts, re-layout after changes. |
| `ng-diagram-styling` | CSS variables, themes and dark mode, background, state classes. |
| `ng-diagram-layering` | `zOrder`, bring to front and send to back, z-index config. |
| `ng-diagram-minimap` | The minimap component, its styling and templates. |
| `ng-diagram-troubleshooting` | Something is broken and you start from a symptom or a console message. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
