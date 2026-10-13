---
name: ng-diagram-transactions
description: Use when grouping ng-diagram changes into one atomic update with transaction() - awaiting it, async callbacks, operation order (a re-added id disappears), select() inside doing nothing, or "nested transaction outlived its parent".
license: Apache-2.0
---

# Transactions (NgDiagramService.transaction)

How to apply several changes as one update, in which order they land, how async callbacks, nesting and `waitForMeasurements` behave. Single calls and reads are in `ng-diagram-state-updates`; what middlewares see of a transaction is in `ng-diagram-middleware`.

## Rules

- **One transaction for one logical edit.** All changes queued in the callback become one update: one pass through the middleware chain, one commit to the model, one set of diagram events. Put loops inside one transaction, never one transaction per iteration. For many changes of one kind, one array call (`updateNodes([...])`) is already a single update.
- **`transaction()` returns `Promise<TransactionResult>` for every callback form** (since 1.3.0; before, the sync-callback form without options returned `void`, so `await` did not wait). Await it when the next step needs the committed state.
- **Inside the callback, calls only queue changes.** Their promises resolve at once (nothing to await; use `void` only if your linter asks), and getters still return the state from before the transaction until it commits.
- **Order is by type, not by call.** At commit, the queued changes are merged and applied as: add nodes → add edges → remove edges → remove nodes → update nodes → update edges → merge metadata.
- **Lookups run at call time.** Calls that read the model to build their change see the model as it was before the transaction: `select`, `deleteNodes` (descendants and connected edges), `addToGroup`/`removeFromGroup`, `bringToFront`/`sendToBack`, `attachEdge`/`detachEdge`, `zoomToFit`/`centerOnNode`, `resizeNode` (logs `[ngDiagram] Resize node failed: Node not found.` for a node added in the same transaction) and `rotateNodeTo` (does nothing for it). `moveNodesBy` computes from the node objects you pass, so two moves of one node in one transaction do not add up. Run such calls after the `await`.
- **`waitForMeasurements` belongs to the root transaction**, not to the calls inside it.
- **Keep callbacks short and synchronous: load data first, then open the transaction.** While a transaction is open, every other diagram update joins it, including user drags, calls from other components and size measurements, and appears only when it commits.
- **A throwing callback applies nothing**: the queued changes are discarded and the promise rejects with the error. That includes updates that joined while it was open (user drags, size and port measurements), one more reason to load data first. Throwing is the way to abort; the public `transaction()` has no name, savepoint or rollback API.

## Build a diagram part from data, then fit

```ts
import { Component, inject } from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramService,
  NgDiagramViewportService,
  type Edge,
  type Node,
} from 'ng-diagram';

@Component({ selector: 'app-diagram-loader', template: '' })
export class DiagramLoaderComponent {
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly api = inject(DiagramApi); // your own data service

  async addGraph(nodes: Node[], edges: Edge[]) {
    await this.diagramService.transaction(
      () => {
        this.modelService.addNodes(nodes);
        this.modelService.addEdges(edges);
      },
      { waitForMeasurements: true }
    );
    await this.viewportService.zoomToFit(); // new nodes and edges are measured now
  }

  async addFromServer(diagramId: string) {
    const { nodes, edges } = await this.api.load(diagramId); // no transaction is open while waiting
    await this.addGraph(nodes, edges);
  }
}
```

Async callbacks (`transaction(async () => { ... })`) are supported, but the transaction stays open across every `await` inside it, with the side effects listed in the rules. To replace the whole diagram (for example when loading a saved file), create a new model instead (`ng-diagram-persistence`).

## One atomic edit made of different operations

```ts
// Class body; diagramService, modelService and selectionService are injected.
// Split an edge: a new node in the middle, two new edges, the old edge removed
async insertNodeOnEdge(edgeId: string, node: Node) {
  const edge = this.modelService.getEdgeById(edgeId);
  if (!edge) return;

  const result = await this.diagramService.transaction(() => {
    this.modelService.deleteEdges([edge.id]);
    this.modelService.addNodes([node]);
    // crypto.randomUUID needs HTTPS or localhost; use your own id helper otherwise
    this.modelService.addEdges([
      { id: crypto.randomUUID(), source: edge.source, sourcePort: edge.sourcePort, target: node.id, data: {} },
      { id: crypto.randomUUID(), source: node.id, target: edge.target, targetPort: edge.targetPort, data: {} },
    ]);
  });
  console.log(result.commandsCount, result.actionTypes); // 3, ['transaction', 'deleteEdges', 'addNodes', 'addEdges']

  // Lookups such as select() read the committed model: call them after the commit
  await this.selectionService.select([node.id]);
}
```

## What the fixed order means

- `addNodes([a])`, `addEdges([e])`, `addNodes([b])` → both nodes are added together, then the edge.
- **Delete and re-add the same id in one transaction → the element ends up deleted**, because adds run before removes. Use new ids, two awaited steps, or a new model.
- An update to an element that the same transaction deletes is ignored (removes run before updates).
- Several updates of the same element apply in call order; for each property the last value wins. Metadata updates are merged shallowly, the last one wins.
- `deleteNodes` in a transaction does not remove edges that the same transaction adds to those nodes (it collects connected edges at call time): delete such edges yourself or add them after the commit.

## Nested and overlapping transactions

- A transaction started while another one is open joins it: from inside the callback, or from anywhere else while an async transaction is waiting. Its changes are applied when the outer (root) transaction commits, and its own promise resolves after its callback with an empty result (`commandsCount: 0`).
- `waitForMeasurements` on a nested transaction is ignored with the warning `[ngDiagram] waitForMeasurements is ignored on a nested transaction — its updates are applied (and measured) only when the root transaction commits. Pass the option to the root transaction instead.`
- When a nested transaction is not awaited and finishes after its parent, it commits by itself and logs `[ngDiagram] A nested transaction outlived its parent transaction — committing its updates independently. Await transactions instead of running them fire-and-forget.` Before 1.3.0 such overlapping updates could be lost.
- `waitForMeasurements` passed to a service call inside a transaction is ignored with `[ngDiagram] waitForMeasurements is ignored inside a transaction — pass { waitForMeasurements: true } to the transaction itself instead.`
- `NgDiagramService.cancelActiveInteraction()` is refused while a transaction is open (console warning); await the transaction first.

## Result, waiting and debugging

- `TransactionResult`: `results` is the merged `FlowStateUpdate` sent into the middleware chain (before middlewares changed it), `commandsCount` the number of queued changes, `actionTypes` is `'transaction'` followed by the action types of the queued changes (each type once). Middlewares see the same list in `context.modelActionTypes`.
- When a middleware cancels the commit, the promise still resolves with this result and nothing is applied. When a middleware throws, the promise rejects.
- `{ waitForMeasurements: true }` waits only for elements changed by this transaction and settles on its own. Hidden elements are not waited for (since 1.4.0).
- An empty transaction resolves immediately; since 1.3.0 it is no longer a "wait for measurements" barrier. To wait for re-measurement, `await ngDiagramService.invalidateMeasurements()`.
- `debugMode: true` in the config (or `updateConfig({ debugMode: true })` at runtime) logs every committed update as `[ngDiagram] <action types>` with `{ initialState, finalState, history, initialUpdate }`, and `[ngDiagram] Render: +A -R nodes (total: N): Xms` when the rendered nodes change. A transaction cancelled by a middleware is not logged.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| `zoomToFit()` / `centerOnNode()` after adding ignores the new nodes | Not measured yet. `await transaction(cb, { waitForMeasurements: true })`, then fit. |
| `await transaction(() => ...)` returns before the change is applied | ng-diagram older than 1.3.0 returned `void` for a sync callback without options. Upgrade, or pass an options object (for example `{ waitForMeasurements: false }`) to get the promise. |
| A node deleted and re-added with the same id in one transaction is missing | Adds run before removes. New ids, two awaited steps, or a new model. |
| `select([newId])` in the same transaction selects nothing | Lookups see the model before the transaction. Select after `await transaction(...)`. |
| After `deleteNodes`, an edge added in the same transaction still points at the deleted node | Connected edges are collected at call time. Delete that edge too or add it after the commit. |
| Nodes stop following the pointer while a transaction waits for a server | User updates join the open transaction. Load data before opening it. |
| Warning `A nested transaction outlived its parent transaction` | Un-awaited transactions overlap. Await each transaction. |
| Warning `waitForMeasurements is ignored on a nested transaction` / `inside a transaction` | Pass the option to the root transaction only. |
| An empty transaction no longer waits for measurements | Changed in 1.3.0. Use `await invalidateMeasurements()`. |
| Changes from overlapping transactions get lost | ng-diagram older than 1.3.0; fixed in 1.3.0, upgrade. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
