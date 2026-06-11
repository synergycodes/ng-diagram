# `@ng-diagram-package/e2e`

End-to-end harness for ng-diagram, powered by Playwright.

The workspace ships two pieces that work together:

- a **minimal Angular harness app** (`harness/`) that boots `ng-diagram` with a
  seedable model and exposes the public services on `window.__diagram`, and
- a **Playwright suite** (`tests/`) that drives the harness in a real browser
  via a high-level `Diagram` page object.

It exists for behaviour pure unit tests can't cover: async middleware, signal
freshness after service calls, `ResizeObserver` callbacks, real DOM measurement.

## Layout

```
apps/e2e/
├── angular.json             # one project: "harness" (ng serve on :4201)
├── playwright.config.ts     # webServer starts the harness; chromium-only for now
├── harness/
│   ├── main.ts              # bootstrapApplication(...)
│   ├── harness.component.ts # mounts ng-diagram, exposes window.__diagram
│   ├── api.ts               # HarnessBridge / DiagramHandle types shared with tests
│   └── default-model.ts     # deterministic seed model
└── tests/
    ├── fixtures/
    │   ├── diagram.ts       # Diagram page object + extended `test`
    │   └── models.ts        # named seed models (trio, pair, solo)
    ├── render.spec.ts
    ├── selection.spec.ts
    ├── drag.spec.ts
    ├── linking.spec.ts
    ├── viewport.spec.ts
    └── model.spec.ts
```

## Running locally

From the repo root, after `pnpm install`:

```bash
# one-time: download chromium
pnpm e2e:install

# headless (CI mode)
pnpm e2e

# headed (watch the browser)
pnpm --filter @ng-diagram-package/e2e e2e:headed

# interactive UI mode
pnpm e2e:ui

# step-through debugger
pnpm --filter @ng-diagram-package/e2e e2e:debug

# open the last HTML report
pnpm --filter @ng-diagram-package/e2e e2e:report
```

`playwright.config.ts` declares `webServer`, so every command above launches
the Angular dev server automatically and reuses it across reruns. The very
first run pays Angular's ~5–10s compile; subsequent runs are instant.

## Writing tests

### The `Diagram` page object

`tests/fixtures/diagram.ts` exposes a `diagram` fixture. It has three groups
of helpers — each lets you stay at one level of abstraction inside a test:

```ts
test('clicking a node selects it', async ({ diagram }) => {
  await diagram.load();
  await diagram.node('node-a').click(); // locator
  await expect.poll(async () => (await diagram.selection.selection()).nodes.map((n) => n.id)).toEqual(['node-a']); // ng-diagram service via the proxy
});
```

1. **ng-diagram services** — `diagram.diagram`, `.model`, `.nodes`,
   `.selection`, `.viewport`, `.groups`, `.clipboard`. Each one is a typed
   `Remote<…>` proxy of the matching public ng-diagram service. Call its
   methods (and signal-typed properties) exactly as you would in Angular —
   the call hops to the browser and resolves with the serialized result.
   New ng-diagram services and methods become available automatically; the
   fixture doesn't need to know about them.

   ```ts
   await diagram.selection.select(['node-a']);
   await diagram.model.addNodes([{ id: 'n', position: { x: 0, y: 0 }, data: {} }]);
   await diagram.viewport.setViewport(0, 0, 1);
   const nodes = await diagram.model.nodes(); // signal read
   ```

2. **Locators** — `node(id)`, `edge(id)`, `port(nodeId, portId)`, `allNodes`,
   `allEdges`, `container`. Use these with Playwright's web-first assertions
   (`toBeVisible`, `toHaveCount`, `toBeAttached`).

3. **Gestures** — `dragNode`, `linkPorts`, `panBy`, `clickCanvas`. Wraps the
   pointer-down / intermediate-move / pointer-up dance so tests don't spell
   it out every time.

For escape hatches the proxy can't cover (event listeners, middleware
registration, transactions with callbacks) drop down to
`diagram.page.evaluate(...)`.

### Seeding a custom model

```ts
test('my scenario', async ({ diagram }) => {
  await diagram.load({
    model: {
      nodes: [{ id: 'one', position: { x: 0, y: 0 }, data: {} }],
      edges: [],
    },
  });
  // ...
});
```

`tests/fixtures/models.ts` collects re-usable shapes — `trio`, `pair`, `solo`.
Prefer one of those over inlining a new model unless the test really needs
something bespoke.

### When to use which approach

- **Assert visibility / counts / attributes** via Locators
  (`expect(diagram.node('x')).toBeVisible()`,
  `expect(diagram.allNodes).toHaveCount(3)`).
- **Assert model state** via the service proxies and `expect.poll`:
  ```ts
  await expect.poll(async () => await diagram.model.nodes()).toHaveLength(3);
  ```
- **Drive interactions** with gestures when you care about the input chain
  (directives → input router → middleware → model adapter), or with the
  service proxies when you only care about the resulting model state.

## Selectors

Stick to these. They're emitted by ng-diagram itself and stay stable as the
library evolves:

- Nodes: `[data-node-id="<id>"]`
- Edges: `[data-edge-id="<id>"]`
- Ports: `[data-port-id="<id>"]`
- Harness-owned elements: `data-testid="..."`

## CI

The `e2e` job in `.github/workflows/pr-check.yml` runs the suite on every PR.
Playwright browsers are cached by `apps/e2e/package.json` hash. On failure,
the HTML report and traces are uploaded as artifacts.

## Out of scope (for now)

- Visual regression
- Cross-browser coverage (Firefox / WebKit can be added under `projects`)
- Performance / load
