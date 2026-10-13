---
name: ng-diagram-persistence
description: Use when saving or loading an ng-diagram (toJSON, localStorage, backend), a custom ModelAdapter over your own store, undo/redo ("Undo is not implemented"), or a restored diagram losing selection, settings or listeners.
license: Apache-2.0
---

# Persistence: save and load, custom stores, undo/redo

Saving with `toJSON()`, restoring by creating a new model, what is kept and stripped, custom `ModelAdapter` implementations, and the reality of undo/redo. Startup timing after a new model is covered in more depth in `ng-diagram-model-init`; image export is in `ng-diagram-export`.

## Rules

- **Save with `NgDiagramModelService.toJSON()`.** It returns a JSON string without runtime properties, in the shape `initializeModel` reads back.
- **Load by creating a new model:** `initializeModel(JSON.parse(json), injector)`. A new model object re-initializes the whole diagram (new engine, new measurement). Pass the `Injector` when you call it outside an injection context, for example in a click handler.
- **After a load, wait for `(diagramInit)`** (or an `effect` on `NgDiagramService.isInitialized()`, which goes `false` and back to `true`) before calling services. Calls made right after assigning the new model can still reach the old engine and get lost; a synchronous `isInitialized()` check at that moment still sees the old engine.
- **A load starts a new engine from `[config]` and `[middlewares]`.** Lost: `updateConfig()` changes, middlewares from `registerMiddleware`, routings from `registerRouting`/`setDefaultRouting`, listeners from `addEventListener`, and `setEventsEnabled(false)`. Re-apply them after `(diagramInit)` (keep `[config]` in sync), or use the `[middlewares]` input and template outputs, which survive.
- **`initializeModel` always creates the default model.** To keep the data in your own store, implement `ModelAdapter` and wrap it with `initializeModelAdapter(adapter, seed?, injector?, options?)` (since 1.1.0).
- **Even with your own store, change the diagram through the services.** Writing into the store and notifying only re-renders: no edge routing, no z-index, no events.
- **Undo/redo is not built in.** Ctrl/Cmd+Z and Ctrl/Cmd+Y call `undo()`/`redo()` on the model adapter; the default model only logs a warning.

## What `toJSON()` keeps and strips

| | Stripped (runtime values, rebuilt after load except node `selected`) | Kept |
| --- | --- | --- |
| Nodes | `selected`, `measuredPorts`, `measuredBounds`, `computedZIndex`, `computedHidden`, internal id | everything else: `id`, `position`, `data`, `type`, `size`, `hidden`, `groupId`, `zOrder`, `angle`, flags, ... |
| Edges | `sourcePosition`, `targetPosition`, `measuredLabels`, `computedZIndex`, `computedHidden`, internal id | everything else, including `points`, `selected`, `hidden`, `routing`, `routingMode`, and the `sourcePosition`/`targetPosition` of a free end (empty `source`/`target`, since 1.3.0) |
| Metadata | nothing | the whole object: `viewport` (`x`, `y`, `scale`, size) and your `metadata.data` |

`initializeModel` and `initializeModelAdapter` strip the same properties from whatever they receive, so a model serialized another way still loads correctly. Node `selected` is dropped both on save and on load, but edge `selected` is kept, so edges that were selected come back selected.

## Save and load

```ts
import { Component, Injector, inject, signal } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramModelService,
  initializeModel,
  provideNgDiagram,
  type Model,
  type ModelAdapter,
} from 'ng-diagram';

const STORAGE_KEY = 'my-diagram';

function readSaved(): Partial<Model> {
  const json = localStorage.getItem(STORAGE_KEY);
  return json ? (JSON.parse(json) as Partial<Model>) : {};
}

@Component({
  selector: 'app-editor',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <button (click)="save()">Save</button>
    <button (click)="load()">Load</button>
    <ng-diagram [model]="model()" (diagramInit)="onReady()" />
  `,
})
export class EditorComponent {
  private readonly injector = inject(Injector);
  private readonly modelService = inject(NgDiagramModelService);

  // Start from the saved diagram, so an autosave never replaces it with an empty one
  readonly model = signal<ModelAdapter>(initializeModel(readSaved()));

  save() {
    localStorage.setItem(STORAGE_KEY, this.modelService.toJSON());
  }

  load() {
    // initializeModel outside an injection context needs the injector
    this.model.set(initializeModel(readSaved(), this.injector)); // a new model re-initializes the diagram
  }

  onReady() {
    // Fires for the first model and again after every load: use services from here on
  }
}
```

The same pattern works with a backend: send `toJSON()` to the server, and build the model from the response with `initializeModel(data, injector)`. To add a fetched part to the current diagram instead of replacing it, use a transaction (`ng-diagram-transactions`).

## Save automatically

```ts
import { Component, effect, inject } from '@angular/core';
import { NgDiagramModelService, NgDiagramService } from 'ng-diagram';

@Component({ selector: 'app-autosave', template: '' })
export class AutosaveComponent {
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);

  constructor() {
    effect((onCleanup) => {
      if (!this.diagramService.isInitialized()) return;
      this.modelService.nodes(); // re-run on node and edge changes
      this.modelService.edges();
      const timer = setTimeout(() => localStorage.setItem('my-diagram', this.modelService.toJSON()), 500);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
```

Restore from the same key at startup, as in the recipe above: the first autosave runs about 500 ms after `diagramInit` and would otherwise overwrite the stored diagram with the initial one. The signals also change on selection and measurement updates; the debounce keeps the number of saves low. Read `metadata()` as well if the viewport should be saved when the user only pans.

## Custom ModelAdapter (your own store)

Implement every `ModelAdapter` member and pass the adapter through `initializeModelAdapter()`. The essentials:

- `getNodes()`/`getEdges()`/`getMetadata()` return the latest written values synchronously.
- `updateNodes`/`updateEdges`/`updateMetadata` accept a value and an updater function, and store what they receive unchanged (runtime properties included).
- After each change, call every `onChange` callback with `{ nodes, edges, metadata }`; `unregisterOnChange` removes exactly that callback.
- `destroy()` runs when `<ng-diagram>` is destroyed or gets another model: drop the callbacks, keep store data that outlives the diagram.
- `toJSON()` is yours: use the exported `stripNodeRuntimeProperties` / `stripEdgeRuntimeProperties`.

Read `references/custom-model-adapter.md` for the full contract, a complete adapter over an Angular signal store, store-integration rules and undo/redo design notes. The docs example is the `LocalStorageModelAdapter` at https://www.ngdiagram.dev/docs/examples/custom-model/.

## Undo and redo

The default model logs `Undo is not implemented in the current model. Please implement a custom ModelAdapter to support undo functionality.` (and the same for redo). To get history, implement `undo()`/`redo()` in a custom adapter. There is no undo method on the services; a toolbar button calls the adapter's `undo()`/`redo()` directly, which is what the shortcut does. Every update, including each drag step and each measurement, writes through the adapter, so record history at user-action boundaries. See section 4 of `references/custom-model-adapter.md`.

## Edge cases

- **Custom stripping (since 1.3.0, at your own risk).** `initializeModel(data, injector, { stripNodeRuntimeProperties, stripEdgeRuntimeProperties })` replaces the strip functions. Wrap the defaults instead of rewriting them:

  ```ts
  // At your own risk: keep node selection across reloads
  readonly model = initializeModel(saved, undefined, {
    stripNodeRuntimeProperties: (node) => ({ ...stripNodeRuntimeProperties(node), selected: node.selected }),
  });
  ```

  This is a class field (injection context); inside a method such as `load()`, pass `this.injector` as the second argument. With `initializeModel` the functions are also used by `toJSON()`; with `initializeModelAdapter` they apply only to initialization. Keeping measured or computed values can break measurement, z-order and internal ids.
- **A replaced default model cannot be reused.** When `<ng-diagram>` gets another model, it destroys the old one (its data is cleared). Switching back to the old object shows an empty diagram that stops updating; build a new model from saved JSON instead.
- **Assigning the same model object again does nothing**; only a different object re-initializes.
- **The saved viewport comes back on load**, but with `zoom.zoomToFit.onInit: true` the diagram fits its content after every `diagramInit`, which replaces the saved view.
- **`initializeModelAdapter(adapter, seed)` replaces the adapter's nodes and edges** with the seed (a missing array becomes empty) and merges metadata. Leave the seed out when the store already holds the diagram.
- **`initializeModel` inside `computed()`** works since 1.2.0 (pass the injector). Every new value re-initializes the diagram.
- **`hidden` is a library property since 1.4.0.** Saved data that already used `hidden: true` for something else hides those elements after the upgrade.
- **Dangling edges** keep their free-end anchors through save and load since 1.3.0 (`ng-diagram-dangling-edges`).

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Ctrl+Z / Ctrl+Y do nothing; console `Undo is not implemented in the current model...` | Default model. Implement `undo()`/`redo()` in a custom adapter. |
| Node selection is lost after load | `selected` is stripped on save and load. Select again after `(diagramInit)`, or keep it with a custom strip function (at your own risk). |
| Calls right after a load do nothing | They reached the old engine. Wait for `(diagramInit)`. |
| A middleware added with `registerMiddleware` stops running after load | New engine. Register it again after `(diagramInit)` or use the `[middlewares]` input (`ng-diagram-middleware`). |
| Settings changed with `updateConfig()` are back to their old values after a load | The new engine starts from `[config]`. Keep `[config]` in sync or re-apply after `(diagramInit)` (`ng-diagram-config`). |
| The stored diagram is replaced by an empty one shortly after startup | An autosave wrote the initial model. Create the first model from the saved data. |
| Listeners added with `addEventListener` stop firing after load | They belonged to the old engine. Add them again after `(diagramInit)` (`ng-diagram-events`). |
| Custom adapter: the diagram does not show changes | `onChange` callbacks are not called after writes. |
| Custom adapter: changes written directly to the store show up, but edges keep old routes and no events fire | Store writes bypass the middleware chain. Apply them through the services. |
| Custom adapter: data disappears when the diagram is destroyed | `destroy()` clears the store. Only drop callbacks there. |
| Diagram is empty or frozen after switching back to an earlier model object | That model was destroyed when it was replaced. Create a new model. |
| `Invalid edge coordinates detected` for dangling edges after load | ng-diagram older than 1.3.0 stripped free-end anchors; fixed in 1.3.0, upgrade. |
| Elements are hidden after upgrading to 1.4.0 | Saved data contains `hidden: true`, now a library flag. Rename your own field. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
