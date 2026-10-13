---
name: ng-diagram-middleware
description: Use when blocking, validating or changing ng-diagram updates with a middleware (createMiddlewares, registerMiddleware), a read-only or viewer mode, locked nodes, limits, or updates that hang, "already registered", "executed next() multiple times".
license: Apache-2.0
---

# Custom middlewares

A middleware sees every change before it reaches the model and can let it pass, change it, or cancel it. This skill covers when to write one, registration and order, the rules that keep the update pipeline alive, and recipes. Reacting to finished user actions is in `ng-diagram-events`; batching is in `ng-diagram-transactions`.

## Middleware, event or service call?

| You want to | Use |
| --- | --- |
| Block or validate a change before it is applied | a middleware that calls `cancel()` |
| Adjust a change, or add derived changes to the same update | a middleware that calls `next(update)` |
| React after a change was applied (save, refresh a panel, analytics) | diagram events (`ng-diagram-events`) or the model signals |
| Make a change from UI code | a service call (`ng-diagram-state-updates`) |

A middleware runs for every update: initialization, each drag step, every measurement update. Keep that in mind for cost and for what you block.

## Rules

- **Call `next()` exactly once, or `cancel()` once, on every code path.** If neither is called, the update never finishes and every later update waits behind it: nodes and edges stop changing and awaited service calls never resolve. A second `next()` call does not run the chain again; it logs the console error `Middleware <name> executed next() multiple times`.
- **Never `await` a mutating call inside a middleware**: service methods, `transaction()`, `invalidateMeasurements()`. The pipeline is locked while your middleware runs, and those promises resolve only after the current update finishes, so the `await` deadlocks. Change the current update with `next(update)` instead. A call without `await` (`void modelService.updateNode(...)`) is safe: it runs as a separate update afterwards, and it passes through your middleware again, so guard against loops.
- **Keep it fast and pass through early.** While a middleware runs or waits, no other update can start (drags, measurements, other calls). Test cheap conditions first: `if (!context.helpers.anyNodesAdded()) { next(); return; }`.
- **Do not mutate objects from `context`.** Send changes as patches: `next({ nodesToUpdate: [{ id, ... }] })`.
- **Block only the action types you mean.** Never cancel `init`, port or label measurement (`...PortsBulk`, `...EdgeLabelsBulk`), `templateVisibilityChange` or `updateViewportSize` (the diagram element changed size). Node sizes measured after initialization arrive as `updateNodes`, and `ng-diagram-base-edge` writes its `routing`/`points` inputs as `updateEdge`.
- **Use unique names.** Registering a name that is already in the chain throws `Middleware <name> already registered`.
- **Throwing rejects, cancelling resolves.** An error thrown in `execute` (or a rejected async `execute`) discards the update and rejects the promise of the call that started it (since 1.3.0; before, it froze the diagram). `cancel()` discards the update, the caller's promise resolves normally, and no diagram events fire. For expected failures, cancel and report through your own channel (a signal, a toast). An error thrown after your `next()` call, once the rest of the chain has finished, is only logged as `[ngDiagram] <error>` and the update is applied: validate before you call `next()`.

## Shape, registration and order

A middleware is `{ name, execute(context, next, cancel) }`; `execute` may be `async`. Register it through the `[middlewares]` input with `createMiddlewares`, which hands you the built-in defaults to arrange:

```ts
// Class body; diagramService is inject(NgDiagramService). The three middlewares are defined below.
// Template: <ng-diagram [model]="model" [middlewares]="middlewares" (diagramInit)="onDiagramInit()" />
readonly middlewares = createMiddlewares((defaults) => [
  protectLockedNodes, // validators first
  snapNewNodes, // transformers before the built-ins
  ...defaults, // observers (logging, audit) after them
]);

private unregisterLimit?: () => void;

// Runtime registration needs the engine: call it from (diagramInit)
onDiagramInit() {
  this.unregisterLimit = this.diagramService.registerMiddleware(
    createMaxNodesMiddleware(500, (message) => console.warn(message))
  );
}
```

- The array you bind replaces the built-ins. Always build it with `createMiddlewares((defaults) => [...yours, ...defaults])`; a plain `[middlewares]="[mine]"` drops edge routing, z-index and internal ids.
- The `[middlewares]` input is read only when a model is initialized; a new array has no effect until the next model. To switch behavior at runtime, read a flag inside the middleware (see read-only mode), or add and remove it with `registerMiddleware`/`unregisterMiddleware`.
- `NgDiagramService.registerMiddleware(m)` returns an unregister function; `unregisterMiddleware(name)` removes by name. It needs the engine (call it after `(diagramInit)` or when `isInitialized()` is true), appends after your `[middlewares]` list, and is lost when a new model is loaded: register again after the next `(diagramInit)`.
- The defaults are `internal-id-assignment` (internal ids that let an element deleted and re-added with the same id render fresh), `z-index` (layering, `computedZIndex`) and `edges-routing` (edge points). Removing one removes that behavior. The `logger` is not in the defaults; it always runs near the end and prints only with `debugMode`. Do not import `loggerMiddleware`: the typings declare it, but the package does not export it (a build error or `undefined` in your chain, depending on the bundler).

Order of one update:

1. `hidden-computation` (computes `computedHidden`)
2. your `[middlewares]` list, in your order
3. middlewares added with `registerMiddleware`, in registration order
4. built-in finishing steps: visibility re-check, measured bounds, logger, measurement tracking, diagram events

Put validators that cancel first. Put transformers that add, move or resize elements or change `zOrder`/`groupId` before the defaults; after them, edge routing and layering of the same update miss your changes. Put observers last.

## Read-only mode

The docs "Custom Middleware" example stores the switch in custom config keys; a signal keeps it typed:

```ts
import { Component, computed, inject, signal } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramService,
  createMiddlewares,
  initializeModel,
  provideNgDiagram,
  type Middleware,
  type NgDiagramConfig,
} from 'ng-diagram';

// User edits to block. 'init', measurement updates ('updateNodes', '...PortsBulk',
// '...EdgeLabelsBulk') and template syncs ('updateEdge') must keep working.
const EDIT_ACTIONS = new Set<string>([
  'moveNodesBy', 'deleteSelection', 'paste', 'paletteDropNode', 'resizeNode', 'rotateNodeTo',
  'changeZOrder', 'startLinking', 'startLinkingFromPosition', 'moveTemporaryEdge', 'finishLinking',
  'startRelinking', 'finishRelinking', 'addNodes', 'addEdges', 'deleteNodes', 'deleteEdges',
]);

export function createReadOnlyMiddleware(isReadOnly: () => boolean): Middleware<'read-only'> {
  return {
    name: 'read-only',
    execute: (context, next, cancel) => {
      if (isReadOnly() && context.modelActionTypes.some((action) => EDIT_ACTIONS.has(action))) {
        cancel();
        return;
      }
      next();
    },
  };
}

/** Gesture flags for edit or read-only mode; apply them in [config] and with updateConfig(). */
const editFlags = (readOnly: boolean): NgDiagramConfig => ({
  nodeDraggingEnabled: !readOnly,
  resize: { defaultResizable: !readOnly },
  nodeRotation: { defaultRotatable: !readOnly },
});

@Component({
  selector: 'app-viewer',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <button (click)="toggleReadOnly()">{{ readOnly() ? 'Edit' : 'Lock' }}</button>
    <ng-diagram [model]="model" [config]="config()" [middlewares]="middlewares" />
  `,
})
export class ViewerComponent {
  private readonly diagramService = inject(NgDiagramService);

  readonly readOnly = signal(true);
  readonly model = initializeModel();
  // [config] is read when a model is initialized; updateConfig() changes the running diagram
  readonly config = computed(() => editFlags(this.readOnly()));
  readonly middlewares = createMiddlewares((defaults) => [
    createReadOnlyMiddleware(() => this.readOnly()),
    ...defaults,
  ]);

  toggleReadOnly() {
    this.readOnly.update((value) => !value);
    // No dragging in read-only mode, so a drop cannot change group membership either
    this.diagramService.updateConfig(editFlags(this.readOnly()));
  }
}
```

`editFlags` hides the resize and rotate handles in read-only mode, except on nodes with their own `resizable`/`rotatable` (the middleware still blocks those changes). A press on a port still starts a draw, which the middleware cancels. To hide the ports, use the port `[hidden]` input as in the `ng-diagram-ports` recipe "Ports visible only in edit mode": a port hidden from its first render is never measured and its edges are not drawn, so when the diagram can start in read-only mode, keep the ports shown until `(diagramInit)` and hide them after it. Never bind a plain `[hidden]="readOnly()"` from the start.

Selection stays allowed; add `'changeSelection'` to the set to block it. Pointer panning does not run middlewares: turn it off with the `viewportPanningEnabled` config if needed (`ng-diagram-config`). Your own code can still change the diagram with `updateNode`/`updateNodeData`/`updateNodes`/`updateEdge(s)`, grouping and `attachEdge`/`detachEdge`, because they share action types with measurement and template syncs: disable your own editing UI in read-only mode. Undo/redo shortcuts call the model adapter directly and are not stopped by middlewares.

## Validation: limits and protected nodes

```ts
import type { Middleware, Node } from 'ng-diagram';

export function createMaxNodesMiddleware(max: number, onRejected: (message: string) => void): Middleware<'max-nodes'> {
  return {
    name: 'max-nodes',
    execute: (context, next, cancel) => {
      // nodesMap already contains the nodes of this update
      if (context.helpers.anyNodesAdded() && context.nodesMap.size > max) {
        onRejected(`A diagram can have at most ${max} nodes.`);
        cancel();
        return;
      }
      next();
    },
  };
}

const isLocked = (node: Node) => 'locked' in node.data && node.data.locked === true;

export const protectLockedNodes: Middleware<'protect-locked-nodes'> = {
  name: 'protect-locked-nodes',
  execute: (context, next, cancel) => {
    // getRemovedNodes() covers every way to delete: Delete key, cut, deleteNodes, group deletes
    if (context.helpers.getRemovedNodes().some(isLocked)) {
      cancel(); // blocks the whole update, including other selected elements
      return;
    }
    next();
  },
};
```

## Change the update in flight

```ts
import type { Middleware } from 'ng-diagram';

const GRID = 20;
const snap = (value: number) => Math.round(value / GRID) * GRID;

export const snapNewNodes: Middleware<'snap-new-nodes'> = {
  name: 'snap-new-nodes',
  execute: (context, next) => {
    const { helpers } = context;
    if (!helpers.anyNodesAdded()) {
      next();
      return;
    }
    // Patch the added nodes; do not re-send them in nodesToAdd
    next({
      nodesToUpdate: helpers.getAddedNodes().map((node) => ({
        id: node.id,
        position: { x: snap(node.position.x), y: snap(node.position.y) },
      })),
    });
  },
};
```

Register it before the defaults so edges added together with the nodes are routed to the snapped positions. For an audit log (observer) and for validation that waits for your server, read `references/recipes.md`.

## Edge cases

- **Action types.** A single call reports one type; a transaction reports `'transaction'` followed by the types of its queued changes; a service call with `{ waitForMeasurements: true }` reports its own name. Each drag step is a `'moveNodes'` update that contains `'moveNodesBy'`. Read `references/context-and-action-types.md` for which action produces which type, all context fields and all helpers.
- **The list grows.** `modelActionTypes` can hold strings outside the `ModelActionType` union (`'transaction'`, `'updateEdges'`, `'updateViewportSize'`, `'zoomToFit'`, `'centerOnNode'`, `'centerOnRect'`). 1.3.0 added `'cancelDrag'`, `'cancelResize'`, `'cancelRotate'`; 1.4.0 added `'startLinkingFromPosition'`, `'startRelinking'`, `'finishRelinking'`, `'templateVisibilityChange'`. An exhaustive `switch` breaks on upgrade; use a `Set` and pass everything else through.
- **`next(update)` details.** An entry in `nodesToAdd` with an existing id replaces the whole node; patch with `nodesToUpdate`. Updates for unknown ids are ignored. Your update shows up in `context.history` for later middlewares.
- **`await next()`** resolves with the final state of the update, or with the initial state when a later middleware cancelled, and throws when a later middleware threw. After that point the update can no longer be changed.
- **Services inside a middleware read the committed model** (before this update); read in-flight data from `context.nodesMap`/`edgesMap`. To test the in-flight geometry of a node against the committed nodes, pass the node object: `modelService.getOverlappingNodes(context.nodesMap.get(id)!)` (create the middleware where the service can be injected, for example in a factory).
- **Debugging:** `debugMode: true` logs every committed update as `[ngDiagram] <action types>` with `initialState`, `finalState`, `history` (what each middleware passed to `next()`) and `initialUpdate`. An update cancelled by a middleware is not logged (the logger runs after your middlewares): log inside your middleware to see what it cancels.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Nothing changes any more and awaited service calls never resolve | A middleware path returns without `next()`/`cancel()`, or a middleware awaits a mutating call (deadlock). |
| Error `Middleware <name> already registered` | The same name is registered twice on one diagram: twice in the `[middlewares]` list, in the list and with `registerMiddleware`, or by two `registerMiddleware` calls. Use unique names or unregister first. |
| Console error `Middleware <name> executed next() multiple times` | `next()` is called on two paths, for example before and after an `await`. Call it once. |
| Edges do not follow nodes that my middleware moved | It runs after `edges-routing`. Put it before the defaults. |
| Edges disappear, or layering breaks, after adding `[middlewares]` | The bound array replaces the built-ins. Build it with `createMiddlewares` and keep `...defaults`. |
| My middleware stops running after a new model is loaded | It was added with `registerMiddleware`, which belongs to the old engine. Use `[middlewares]` or register again after `(diagramInit)`. |
| Replacing the `[middlewares]` array does nothing | The input is read only when a model is initialized. Keep one array and read a flag inside, or use `registerMiddleware`/`unregisterMiddleware` at runtime. |
| Node sizes or edge routing stop updating while my middleware is active | It cancels `updateNodes` or `updateEdge`, which carry measurements and template syncs. Narrow the condition. |
| A cancelled change still resolves `await` without an error | `cancel()` resolves the caller's promise. Report rejections through your own channel. |
| TypeScript complains about a `switch` over `ModelActionType` after an upgrade | New action types in 1.3.0 and 1.4.0. Use a `Set` with a pass-through default. |
| The diagram stops applying any change after a middleware error | ng-diagram older than 1.3.0; fixed in 1.3.0 (the caller's promise rejects instead), upgrade. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
