---
name: ng-diagram-config
description: Use when configuring ng-diagram - [config] vs updateConfig(), a config change that has no effect, NgDiagramConfig/FlowConfig keys and defaults, custom node and edge IDs (computeNodeId), edge panning, or debugMode logging.
license: Apache-2.0
---

# ng-diagram configuration

How `[config]`, `NgDiagramService.updateConfig()` and the `config()` signal work, which settings apply at runtime, and common setups: custom IDs, edge panning, viewer mode, debug logging. Read `references/config-reference.md` for every key with its default and its owning skill.

## Rules

- **Pass only overrides.** `NgDiagramConfig` is a deep partial of `FlowConfig`; every key you leave out keeps its default.
- **`[config]` is read when the diagram creates its engine:** on first render and whenever you bind a new model. Binding a new config object later does not reach the engine. Exception: `hideWatermark` and `watermarkPosition` follow the binding at any time.
- **Change settings at runtime with `updateConfig(partial)`.** It deep-merges into the running config and updates the `config()` signal. A new model creates a new engine from `[config]`, so `updateConfig()` changes are lost then: keep `[config]` in sync if you swap models.
- **Merging:** objects merge key by key, but arrays (`shortcuts`) and functions replace the old value, and `undefined` values are skipped. To reset a key, pass its default value.
- **Let function options read your own state.** Callbacks such as `validateConnection`, `shouldSnapDragForNode` or `canGroup` run on every use, so a callback that reads your signal needs no `updateConfig()` and survives model swaps.
- **Type callback parameters yourself.** In 1.4.0 the deep-partial `NgDiagramConfig` type drops the signature of callbacks that take parameters (`linking.validateConnection`, both edge data builders, `resize.getMinNodeSize`, `grouping.canGroup`, the snapping and rotation callbacks): inline parameters become implicit `any` (TS7006 under `strict`), and a wrong signature or return type still compiles. Build the section with its own type (`const linking: Partial<LinkingConfig> = { ... }`, likewise `Partial<SnappingConfig>`, `Partial<ResizeConfig>`, `Partial<GroupingConfig>`, `Partial<NodeRotationConfig>`): it types the parameters and checks the signature. Annotating the parameters (`(node: Node) => ...`) only types the body. Optional callbacks (`danglingEdges.*`) and `computeNodeId`/`computeEdgeId` keep their types.
- **`config()` is `{}` until just after the first `diagramInit`** (still `{}` inside that handler), then the full merged config with all defaults. After a model swap it shows the previous engine's config until the new initialization. Its type is a deep partial: use optional chaining.

## Config binding and runtime changes

```typescript
@Component({
  selector: 'app-editor',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <ng-diagram [model]="model" [config]="config" />
    <label><input type="checkbox" [checked]="snapToGrid()" (change)="snapToGrid.set(!snapToGrid())" /> Snap</label>
    <button (click)="setMaxZoom(2)">Max zoom 200%</button> {{ maxZoom() }}
  `,
})
export class EditorComponent {
  private readonly diagram = inject(NgDiagramService);
  readonly snapToGrid = signal(false);

  // Read when the diagram creates its engine (first render and every new model)
  readonly config: NgDiagramConfig = {
    zoom: { max: 3 },
    snapping: {
      // Callbacks run on every use: reading your own signal needs no updateConfig()
      shouldSnapDragForNode: () => this.snapToGrid(),
      shouldSnapResizeForNode: () => this.snapToGrid(),
      defaultDragSnap: { width: 20, height: 20 },
    },
  };

  // {} until diagramInit, then the full merged config
  readonly maxZoom = computed(() => this.diagram.config().zoom?.max);

  model = initializeModel();

  setMaxZoom(max: number): void {
    this.diagram.updateConfig({ zoom: { max } }); // deep merge: other zoom keys stay
  }
}
```

`updateConfig()` throws `[ngDiagram] Library engine not initialized yet.` before `<ng-diagram>` has created its engine (see `ng-diagram-model-init`).

## Keys that are not re-read at runtime

| Key | Read | Change it later by |
| --- | --- | --- |
| `virtualization.enabled` | Rendering and the pan handler: when the engine is created (`zoomToFit`, the minimap, port cleanup and `[ngDiagramHidden]` read it live) | New `[config]` value plus a new model (below); not `updateConfig()`. |
| `edgeRouting.defaultRouting` | When the engine is created | `NgDiagramService.setDefaultRouting(name)`, see `ng-diagram-edge-routing`. |
| `zoom.zoomToFit.onInit` | When `diagramInit` fires | `[config]` before the next model. |
| `hideWatermark`, `watermarkPosition` | From the `[config]` binding only | Changing the bound object; `updateConfig()` ignores them. |
| `viewportPanningEnabled` | Behavior: on every gesture. Grab cursor: when the engine is created | `updateConfig()` changes the behavior; the `grab` cursor stays as it was. |

Settings used to compute stored results (routing options, `zIndex`, snapping sizes) apply to what is computed after the change: existing edges keep their path until they or their nodes change.

## Change an init-only key (virtualization)

```typescript
@Component({
  selector: 'app-big-diagram',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `<ng-diagram [model]="model()" [config]="config()" />`,
})
export class BigDiagramComponent {
  private readonly injector = inject(Injector);
  private readonly modelService = inject(NgDiagramModelService);

  readonly config = signal<NgDiagramConfig>({ virtualization: { enabled: false } });
  readonly model = signal(initializeModel());

  setVirtualization(enabled: boolean): void {
    const data = JSON.parse(this.modelService.toJSON()) as Partial<Model>;
    this.config.update((config) => ({ ...config, virtualization: { ...config.virtualization, enabled } })); // keeps padding/idleDelay
    this.model.set(initializeModel(data, this.injector)); // new engine reads the new [config]
  }
}
```

The new model is a full re-initialization (`ng-diagram-model-init`). Virtualization itself: `ng-diagram-performance`.

## Custom node and edge IDs

```typescript
// crypto.randomUUID exists only on HTTPS and localhost
const uid = (): string =>
  typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const idConfig: NgDiagramConfig = {
  computeNodeId: () => `node_${uid()}`,
  computeEdgeId: () => `edge_${uid()}`,
};
```

- `computeNodeId` names nodes dropped from the palette and every pasted node.
- `computeEdgeId` names every pasted edge and every edge the user draws. A drawn edge gets its id before `linking.finalEdgeDataBuilder` runs, so the builder can still replace it.
- Neither is used by `addNodes`, `addEdges` or `initializeModel`: you pass those ids yourself.
- Default: `crypto.randomUUID()`, or `Date.now()` plus a random string where `crypto.randomUUID` is missing (plain `http://` other than localhost). IDs must stay unique: a plain counter restarts after a reload and collides with saved ids.

## Edge panning

Dragging near the border of the diagram pans the viewport, faster the closer the pointer is to the border.

```typescript
export const panningConfig: NgDiagramConfig = {
  selectionMoving: { edgePanningThreshold: 60, edgePanningForce: 15 }, // dragging nodes
  linking: { edgePanningEnabled: false }, // drawing and relinking edges
};
```

- `selectionMoving.edgePanningEnabled` / `edgePanningThreshold` / `edgePanningForce` (defaults `true`, `30` px, `10`): while dragging nodes. The threshold is also the margin the viewport keeps around nodes moved with the arrow keys.
- `linking.edgePanningEnabled` / `edgePanningThreshold` / `edgePanningForce` (same defaults): while drawing or relinking an edge.
- Both need `viewportPanningEnabled: true`.

## Panning and dragging switches

- `viewportPanningEnabled: false` (since 0.9.0): no panning with mouse, touch, wheel or trackpad, no arrow-key panning, no edge panning. Zooming and programmatic moves (`moveViewport`, `setViewport`, `zoomToFit`) still work. See `ng-diagram-viewport`.
- `nodeDraggingEnabled: false` (since 1.0.0): nodes cannot be dragged or moved with the arrow keys; since 1.4.0 the arrow keys pan the viewport instead. For single nodes use `draggable: false` (`ng-diagram-custom-nodes`). Programmatic moves still work.

## Viewer (read-only) settings

```typescript
export const viewerConfig: NgDiagramConfig = {
  nodeDraggingEnabled: false, // no drag, no arrow-key move (arrows pan instead)
  resize: { defaultResizable: false }, // nodes with resizable: true still show handles
  nodeRotation: { defaultRotatable: false }, // same for rotatable: true
  linking: { validateConnection: () => false }, // a draw can start but never connects to a port ('noTarget')
  shortcuts: configureShortcuts([
    { actionName: 'deleteSelection', bindings: [] },
    { actionName: 'cut', bindings: [] },
    { actionName: 'paste', bindings: [] },
  ]),
};
```

These flags remove most editing gestures, but they are not a lock: nodes with their own `resizable: true` or `rotatable: true` keep their handles, users can still select, and your code can still change the model. With `danglingEdges.enabled`, also set `danglingEdges: { shouldKeepOnDrop: () => false }`: the connection validator is not called for a drop on empty canvas, so such a drop still keeps a dangling edge. To block changes for real, cancel them in a middleware. For a runtime read-only toggle that blocks changes (and how to hide ports in it), see `ng-diagram-middleware` (Read-only mode). Shortcut names: `ng-diagram-shortcuts`.

## Debug logging

`debugMode: true` logs every committed model update (an update cancelled by a middleware is not logged) as `[ngDiagram] <action types>` with `{ initialState, finalState, history, initialUpdate }`, and logs render timings (`[ngDiagram] Render: +<added> -<removed> nodes (total: <n>): <ms>ms`) when the set of rendered nodes changes. It can be switched at runtime with `updateConfig({ debugMode: true })`. It does not put the engine on `window`. It logs full state objects on every update, so keep it off in production.

## Edge cases

- Settings read through the `config()` signal apply only from `diagramInit` on: `background`, `defaultNode.removePorts`, `resize.defaultResizable`, `nodeRotation.defaultRotatable`, `linking.defaultRelinkable`. For example, with `defaultNode: { removePorts: true }` the default ports exist during the first initialization and disappear right after it.
- `shortcuts` is replaced as a whole: build the list with `configureShortcuts(...)`, which merges with the defaults. At runtime pass the live list as the second argument, `configureShortcuts(changes, diagram.config().shortcuts as ShortcutDefinition[])`, or earlier changes reset to the defaults (`ng-diagram-shortcuts`).
- Every new engine starts from `[config]`; middlewares and custom routings registered at runtime are dropped too (`ng-diagram-model-init`).

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Changing the object bound to `[config]` does nothing | Read only when the engine is created: call `updateConfig()`. |
| A setting changed with `updateConfig()` is back after loading another model | The new engine starts from `[config]`: keep `[config]` in sync. |
| `updateConfig({ edgeRouting: { defaultRouting: 'bezier' } })` has no effect | Read once: use `setDefaultRouting('bezier')`. |
| `updateConfig({ virtualization: { enabled: true } })` leaves the diagram half switched | Part of the code reads the flag at once (`zoomToFit`, the minimap, port cleanup, `[ngDiagramHidden]`), but rendering and panning were set up when the engine was created. Change `[config]` and create a new model (recipe above). |
| TS7006 "Parameter 'node' implicitly has an 'any' type" in a config callback | The `NgDiagramConfig` type drops callback signatures: type the section (`Partial<LinkingConfig>`, `Partial<SnappingConfig>`, ...) or at least annotate the parameters. |
| `updateConfig({ hideWatermark: true })` has no effect | Watermark keys come from the `[config]` binding only. |
| Custom shortcuts lost all default shortcuts | Arrays replace the old value: use `configureShortcuts()`. |
| `config().zoom` is `undefined` | `config()` is `{}` until just after the first `diagramInit`: use optional chaining or wait for `isInitialized()`. |
| Passing `undefined` does not restore a default | `undefined` is skipped: pass the default value. |
| Grab cursor still shown after `updateConfig({ viewportPanningEnabled: false })` | The cursor follows `[config]` at engine creation: put the flag in `[config]` from the start, or create a new model after changing `[config]`. |
| Viewer mode still lets users resize some nodes | Node-level `resizable: true` wins over `defaultResizable`: remove it or block changes in a middleware. |
| Console fills with `[ngDiagram] ...` logs | `debugMode: true`: turn it off. |
| Drawn or pasted elements get ids in an unwanted format | Set `computeNodeId` / `computeEdgeId`. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
