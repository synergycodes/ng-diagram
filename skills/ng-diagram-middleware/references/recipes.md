# More middleware recipes: audit log, async validation

Read this when a middleware must record changes (audit log, change feed) or wait for your server before letting a change through.

## Audit log (observer)

```ts
import type { Middleware } from 'ng-diagram';

export interface AuditEntry {
  at: number;
  actions: string[];
  addedNodeIds: string[];
  removedNodeIds: string[];
  addedEdgeIds: string[];
  removedEdgeIds: string[];
}

export function createAuditMiddleware(log: (entry: AuditEntry) => void): Middleware<'audit-log'> {
  return {
    name: 'audit-log',
    execute: (context, next) => {
      const { helpers } = context;
      if (helpers.anyNodesAdded() || helpers.anyNodesRemoved() || helpers.anyEdgesAdded() || helpers.anyEdgesRemoved()) {
        log({
          at: Date.now(),
          actions: [...context.modelActionTypes],
          addedNodeIds: helpers.getAddedNodes().map((node) => node.id),
          removedNodeIds: helpers.getRemovedNodes().map((node) => node.id),
          addedEdgeIds: helpers.getAddedEdges().map((edge) => edge.id),
          removedEdgeIds: helpers.getRemovedEdges().map((edge) => edge.id),
        });
      }
      next();
    },
  };
}
```

Register it last (class body; `createMiddlewares` from `'ng-diagram'`, `auditLog` is an `AuditEntry[]` field):

```ts
// Last in the list: after it run only middlewares added with registerMiddleware and the built-in finishing steps
readonly middlewares = createMiddlewares((defaults) => [
  ...defaults,
  createAuditMiddleware((entry) => this.auditLog.push(entry)),
]);
```

- Middlewares added with `registerMiddleware` run after your whole `[middlewares]` list, so a validator registered that way (like `createMaxNodesMiddleware` in SKILL.md) can still cancel an update this middleware already logged. Keep validators in the `[middlewares]` list, or register the audit log last with `registerMiddleware`. The built-in finishing steps never cancel.
- The log covers structure changes only. Moves would produce one entry per drag step; record finished moves from the `nodeDragEnded` event instead (`ng-diagram-events`).
- For property changes use `helpers.getChangedNodeIds()` / `getChangedEdgeIds()` (since 1.2.2) or `getAffectedNodeIds(['data'])`.

## Async validation (server check)

```ts
import type { Middleware, Node } from 'ng-diagram';

export function createServerCheckMiddleware(check: (nodes: Node[]) => Promise<boolean>): Middleware<'server-check'> {
  return {
    name: 'server-check',
    execute: async (context, next, cancel) => {
      if (!context.helpers.anyNodesAdded()) {
        next();
        return;
      }
      // No other diagram update can start while this waits: keep it short
      const allowed = await check(context.helpers.getAddedNodes()).catch(() => false);
      if (allowed) {
        next();
      } else {
        cancel();
      }
    },
  };
}
```

- Awaiting your own API is allowed; awaiting a diagram service call is the deadlock described in SKILL.md.
- While the request runs, drags, measurements and every other update wait in line, so the diagram feels frozen. When your own code creates the change (for example a form that adds a node), run a slow check there, before calling the service.
- Catch errors yourself: a rejected `execute` discards the update and rejects the caller's promise.
