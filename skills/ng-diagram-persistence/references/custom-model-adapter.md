# Custom ModelAdapter: contract, full example, undo/redo notes

Read this when you implement `ModelAdapter` yourself (your own store, a backend-synced model, history).

## Contents

1. The contract: what the library calls and what it expects
2. A complete adapter over an Angular signal store
3. Connecting an existing store
4. Undo/redo design notes

## 1. The contract

| Member | When the library calls it | What it must do |
| --- | --- | --- |
| `getNodes()`, `getEdges()`, `getMetadata()` | On every update, lookup and render | Return the latest written values synchronously. Right after `updateNodes(x)`, `getNodes()` must return `x`. |
| `updateNodes`, `updateEdges`, `updateMetadata` | Once each per committed update, with complete arrays/objects. Also during `initializeModelAdapter` (metadata uses the updater-function form), and for metadata alone when the engine starts and during viewport panning. | Accept both forms: a value and an updater function `(prev) => next`. Store what you receive unchanged, including runtime properties (`measuredPorts`, `computedZIndex`, `points`, ...). |
| `onChange(callback)` | The renderer registers a callback when the engine starts, `NgDiagramModelService` when the diagram is initialized. | Call every callback with a `ModelChanges` object (`{ nodes: Node[]; edges: Edge[]; metadata: Metadata }`) after each change. Without this the diagram does not re-render. |
| `unregisterOnChange(callback)` | `NgDiagramModelService` when it is destroyed | Remove exactly that callback. |
| `destroy()` | When `<ng-diagram>` is destroyed or receives another model | Drop all callbacks (the renderer never unregisters its own). Keep the store data if the store outlives the diagram. |
| `toJSON()` | `NgDiagramModelService.toJSON()` | Your serialization. Use the exported `stripNodeRuntimeProperties` / `stripEdgeRuntimeProperties` (since 1.3.0) to drop runtime properties. |
| `undo()`, `redo()` | Ctrl/Cmd+Z and Ctrl/Cmd+Y (the `undo`/`redo` shortcut actions) | Your history, or nothing. |

Wire it with `initializeModelAdapter(adapter, seed?, injector?, options?)` (since 1.1.0). It strips runtime properties from the adapter's current nodes and edges, assigns internal ids and returns the same adapter. A `seed` replaces the adapter's nodes and edges (a missing array becomes `[]`) and is merged into its metadata, so leave it out when the store already holds the diagram. `options` (strip functions) affect only this initialization, not your `toJSON()`.

The engine writes nodes, edges and metadata one after another for every update, so an adapter that notifies after each write (like the example below and the docs example) runs the diagram's change processing three times per update. The default model notifies once, later, from an Angular effect. If this matters for a large diagram, batch your notification, for example once per microtask with `queueMicrotask` (a design option, not measured).

## 2. A complete adapter over an Angular signal store

The same shape as the docs example `LocalStorageModelAdapter` (https://www.ngdiagram.dev/docs/examples/custom-model/), but backed by an injectable store that other parts of the app can read.

```ts
import { Component, Injectable, inject, signal } from '@angular/core';
import {
  NgDiagramComponent,
  initializeModelAdapter,
  provideNgDiagram,
  stripEdgeRuntimeProperties,
  stripNodeRuntimeProperties,
  type Edge,
  type Metadata,
  type ModelAdapter,
  type ModelChanges,
  type Node,
} from 'ng-diagram';

@Injectable({ providedIn: 'root' })
export class DiagramStore {
  private readonly state = signal<ModelChanges>({
    nodes: [],
    edges: [],
    metadata: { viewport: { x: 0, y: 0, scale: 1 } },
  });
  readonly snapshot = this.state.asReadonly();

  set(next: ModelChanges): void {
    this.state.set(next);
  }
}

export class StoreModelAdapter implements ModelAdapter {
  private callbacks: Array<(changes: ModelChanges) => void> = [];

  constructor(private readonly store: DiagramStore) {}

  // Reads must return the latest write synchronously
  getNodes(): Node[] {
    return this.store.snapshot().nodes;
  }
  getEdges(): Edge[] {
    return this.store.snapshot().edges;
  }
  getMetadata(): Metadata {
    return this.store.snapshot().metadata;
  }

  // The library calls both forms: a full array and an updater function
  updateNodes(next: Node[] | ((prev: Node[]) => Node[])): void {
    const state = this.store.snapshot();
    this.write({ ...state, nodes: typeof next === 'function' ? next(state.nodes) : next });
  }
  updateEdges(next: Edge[] | ((prev: Edge[]) => Edge[])): void {
    const state = this.store.snapshot();
    this.write({ ...state, edges: typeof next === 'function' ? next(state.edges) : next });
  }
  updateMetadata(next: Metadata | ((prev: Metadata) => Metadata)): void {
    const state = this.store.snapshot();
    this.write({ ...state, metadata: typeof next === 'function' ? next(state.metadata) : next });
  }

  onChange(callback: (changes: ModelChanges) => void): void {
    this.callbacks.push(callback);
  }
  unregisterOnChange(callback: (changes: ModelChanges) => void): void {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
  }

  toJSON(): string {
    const { nodes, edges, metadata } = this.store.snapshot();
    return JSON.stringify({
      nodes: nodes.map((node) => stripNodeRuntimeProperties(node)),
      edges: edges.map((edge) => stripEdgeRuntimeProperties(edge)),
      metadata,
    });
  }

  // Ctrl/Cmd+Z and Ctrl/Cmd+Y call these
  undo(): void {}
  redo(): void {}

  destroy(): void {
    this.callbacks = []; // the store outlives the diagram: keep its data
  }

  private write(state: ModelChanges): void {
    this.store.set(state);
    for (const callback of this.callbacks) {
      callback(state);
    }
  }
}

@Component({
  selector: 'app-store-diagram',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `<ng-diagram [model]="model" />`,
})
export class StoreDiagramComponent {
  readonly model = initializeModelAdapter(new StoreModelAdapter(inject(DiagramStore)));
}
```

Other components can read `inject(DiagramStore).snapshot()` in templates. They still change the diagram only through the ng-diagram services.

## 3. Connecting an existing store (NgRx, a signal store, a sync engine)

The adapter is the boundary; the rules above decide what works:

- **Synchronous reads after writes.** The engine writes and reads back immediately. If your store applies changes asynchronously, keep a synchronous mirror in the adapter and push to the store from it.
- **Keep everything you receive.** The engine writes complete nodes and edges including runtime properties. A store that normalizes entities and drops unknown fields breaks measurement, routing and layering.
- **Changes from outside (server, other tabs, other users) go through the services** (`addNodes`, `updateNodes`, `deleteEdges`, ...), so the middleware chain runs. Writing them into the store and calling the `onChange` callbacks only re-renders: edges are not re-routed, z-order and hidden state are not recomputed, no diagram events fire, and nothing waits for measurement.
- **One store slice per diagram.** Each engine writes its complete state on every update, so two diagrams writing into the same data overwrite each other.

## 4. Undo/redo design notes

ng-diagram has no history of its own. Facts that shape an implementation:

- Ctrl/Cmd+Z runs the `undo` shortcut action, which calls `model.undo()` on the current adapter; Ctrl/Cmd+Y calls `model.redo()`. Other key bindings (for example Ctrl/Cmd+Shift+Z) are added with `configureShortcuts` (`ng-diagram-shortcuts`). There is no undo method on the services: a toolbar button calls your adapter's `undo()`/`redo()` directly, the same as the shortcut.
- Every committed update writes all of `nodes`, `edges` and `metadata` through the adapter. That includes measurement updates and one update per pointer move during a drag. Record history at user-action boundaries, not on every write.
- Candidate boundaries are the diagram outputs that fire after a change is committed: `diagramInit`, `nodeDragEnded`, `nodeResizeEnded`, `nodeRotateEnded`, `selectionRemoved`, `edgeDrawEnded` (when `success`), `edgeRelinkEnded`, `clipboardPasted`, `paletteItemDropped`, plus your own service calls. There is no official undo implementation to copy; test your design end to end.
- What `undo()` restores goes straight into the adapter: call the `onChange` callbacks to re-render. No middleware runs and no diagram events fire for it.
- Committed snapshots carry runtime properties (sizes, measured ports, routed points, z-index) that match that state. A snapshot taken right after elements were added, before they were measured, lacks their measurements. The state before a user action is already measured: inside a middleware, `context.initialState` is the committed state before the current update (`ng-diagram-middleware`).
- The viewport lives in `metadata`. Leave metadata out of the history if undo should not move the view.
- Selection is stored on the elements (`selected`), so restoring a snapshot also restores the selection of that moment.
