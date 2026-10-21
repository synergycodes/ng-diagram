---
name: ng-diagram-setup
description: Use when adding ng-diagram to an Angular app, a blank or unstyled diagram, "NgDiagram services are not available" or NullInjectorError - provideNgDiagram, [tabbable], watermark, several diagrams, Angular versions, starter templates, docs MCP.
license: Apache-2.0
---

# ng-diagram setup

Install ng-diagram and render a first working diagram, plus the `<ng-diagram>` inputs, keyboard focus (`[tabbable]`), the watermark, several diagrams on one page, Angular support, official starter templates and the docs MCP server. Creating and loading models: `ng-diagram-model-init`. Config keys: `ng-diagram-config`.

## Rules

- **Import `ng-diagram/styles.css` in the global stylesheet** (`src/styles.css` or `src/styles.scss`), not in a component's `styles`. The library is styled with CSS variables defined on `:root`, and an import inside a component's scoped styles leaves the diagram without them. The one import also loads `tokens.css` and `primitives.css`.
- **Add `provideNgDiagram()` to `providers` of the component that renders `<ng-diagram>`**, or of an ancestor that also renders your toolbar and sidebar. Each registration is one isolated diagram: its own engine, services, selection and viewport.
- **Give the parent of `<ng-diagram>` an explicit size.** `<ng-diagram>` is `width: 100%; height: 100%; display: flex`, so a parent without a height gives an invisible, zero-height diagram.
- **Bind a model from `initializeModel()`**: `[model]` is a required input. See `ng-diagram-model-init`.
- **Use `[tabbable]`, not a `tabindex` attribute** (since 1.4.0 the diagram controls its own `tabindex`).

## Install

```bash
npm install ng-diagram
```

Peer dependencies: `@angular/core` and `@angular/common` `>=18.0.0`.

```css
/* src/styles.css or src/styles.scss: the global stylesheet */
@import 'ng-diagram/styles.css';
```

## Minimal working component

```typescript
import { Component } from '@angular/core';
import { NgDiagramBackgroundComponent, NgDiagramComponent, initializeModel, provideNgDiagram } from 'ng-diagram';

@Component({
  selector: 'app-diagram',
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  template: `
    <ng-diagram [model]="model">
      <ng-diagram-background />
    </ng-diagram>
  `,
  styles: `
    :host { display: flex; height: 400px; } /* <ng-diagram> fills its parent: give the parent a size */
  `,
})
export class DiagramComponent {
  model = initializeModel({
    nodes: [
      { id: '1', position: { x: 100, y: 150 }, data: { label: 'Node 1' } },
      { id: '2', position: { x: 400, y: 150 }, data: { label: 'Node 2' } },
    ],
    edges: [{ id: 'e1', source: '1', sourcePort: 'port-right', target: '2', targetPort: 'port-left', data: {} }],
  });
}
```

- All library components are standalone: list them in `imports` (in an NgModule app, in the module's `imports`).
- The default node shows `data.label` (the node id when `label` is missing) and has two ports, `port-left` and `port-right`, that accept links in both directions.
- `<ng-diagram-background />` draws dots (`type="grid"` for a grid). It is the only element projected into `<ng-diagram>`; anything else placed inside it is not rendered. Put overlays such as the minimap or a toolbar next to `<ng-diagram>`, in a parent with `position: relative`.
- The canvas stays invisible until the diagram is initialized (all visible elements measured). See `ng-diagram-model-init`.

## `<ng-diagram>` inputs

| Input | Type | Notes |
| --- | --- | --- |
| `model` (required) | `ModelAdapter` | From `initializeModel()`. A new object re-initializes the diagram (`ng-diagram-model-init`). |
| `config` | `NgDiagramConfig` | Overrides only. Read when the diagram creates its engine; change settings at runtime with `NgDiagramService.updateConfig()` (`ng-diagram-config`). |
| `nodeTemplateMap` | `NgDiagramNodeTemplateMap` | Node `type` to component (`ng-diagram-custom-nodes`). |
| `edgeTemplateMap` | `NgDiagramEdgeTemplateMap` | Edge `type` to component (`ng-diagram-custom-edges`). |
| `middlewares` | `MiddlewareChain` | Build it with `createMiddlewares()` (`ng-diagram-middleware`). |
| `tabbable` | `boolean`, default `true` | Since 1.4.0, see below. |

Outputs: `(diagramInit)` and the interaction events, see `ng-diagram-events`.

## Watermark, focus and a minimap

```typescript
@Component({
  selector: 'app-editor',
  imports: [NgDiagramComponent, NgDiagramMinimapComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="diagram">
      <ng-diagram [model]="model" [config]="config" [tabbable]="false" />
      <ng-diagram-minimap />
    </div>
  `,
  styles: `
    :host { display: block; height: 500px; }
    .diagram { display: flex; height: 100%; position: relative; }
  `,
})
export class EditorComponent {
  readonly config: NgDiagramConfig = {
    watermarkPosition: 'top-left', // or: hideWatermark: true
  };
  model = initializeModel();
}
```

- **Watermark:** shown by default in the bottom-right corner; it links to https://www.ngdiagram.dev/. `hideWatermark: true` hides it (since 0.9.0). `watermarkPosition` (since 1.2.0) takes `'top-left'`, `'top-right'`, `'bottom-left'` or `'bottom-right'`; when the minimap sits in the same corner, the watermark moves to another corner.
- Both watermark keys are read from the `[config]` binding only. `updateConfig({ hideWatermark: true })` does nothing; change the bound object instead.
- **`[tabbable]="false"`** (since 1.4.0) removes the diagram's own Tab stops: the `<ng-diagram>` element and the watermark link get `tabindex="-1"`. Both stay clickable, and keyboard shortcuts work once focus is inside the diagram (a click focuses it). Focusable content in your node and edge templates keeps its Tab stops. `tabbable` on its own means `true`, `tabbable="false"` means `false`, and binding `undefined` or `null` keeps the default. Focus and Tab order: `ng-diagram-shortcuts`.
- Minimap options and styling: `ng-diagram-minimap`.

## Several diagrams on one page

Give each diagram its own `provideNgDiagram()` by wrapping it in its own component. Services injected inside that component (its node templates, its sidebar) talk to that diagram only.

```typescript
@Component({
  selector: 'app-mini-diagram',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()], // own scope: own engine, services, selection, viewport
  template: `<ng-diagram [model]="model()" />`,
  styles: `:host { display: flex; height: 250px; }`,
})
export class MiniDiagramComponent {
  private readonly injector = inject(Injector);
  readonly data = input.required<Partial<Model>>();
  readonly model = computed(() => initializeModel(this.data(), this.injector));
}
```

Two `<ng-diagram>` elements under one registration share one engine and one renderer: the second destroys the first engine (and empties its model), both then show the second model, and destroying either one later destroys the shared engine. Give each diagram its own component with `provideNgDiagram()`.

`<ng-diagram>` may render outside the DOM of the component that declares `provideNgDiagram()` (`ngTemplateOutlet`, a portal, an overlay) as long as it stays in that component's injector tree. Before 1.4.0 this layout logged `[ngDiagram] Node measurement failed: Node element not found.` and left ports at old positions after a resize or rotation; upgrade if you see it.

## Angular support

- Peer dependencies allow Angular 18 and newer (`>=18.0.0`). The API stability policy lists Angular 18 to 21 as supported and Angular 17 as not tested: https://www.ngdiagram.dev/docs/policies/api-stability/
- The examples assume Angular 19+, where components are standalone by default. On Angular 18 add `standalone: true` to every component and directive from these examples, including those without `imports`: Angular 18 does not make them standalone by default, so `imports` reports `'imports' is only valid on a component that is standalone.` and a non-standalone component cannot be listed in another component's `imports`.
- Build on APIs tagged `@public` in `node_modules/ng-diagram/ng-diagram.d.ts`. `@internal` members can change without notice; deprecated APIs are removed only in a major release.

## Start from an official template

Production-style starter apps from the ngDiagram team (overview: https://www.ngdiagram.dev/docs/templates/). Clone one when the user's app is close to it, and check which ng-diagram version its `package.json` pins.

| Template | What it shows | Code |
| --- | --- | --- |
| Org Chart | Tree diagrams: drag-and-drop reordering, expand/collapse subtrees, sidebar editing, horizontal/vertical ELK layouts, dark/light theme, minimap | https://github.com/synergycodes/ng-diagram-orgchart |
| Electric Circuit | Schematic editor: searchable SVG component library, port-to-port wiring with junctions, export to SVG, JPEG and JSON | https://github.com/synergycodes/ng-diagram-electric-circuit |
| Single-Line Diagram | Substation SLD editor: IEC 60617 symbols, geometry-derived junctions, schema-driven properties panel | https://github.com/synergycodes/ng-diagram-single-line-diagram |
| AV Schematic | Audio/video signal flow: device library, typed connectors (XLR, HDMI, Speakon), export to PNG and DXF | https://github.com/synergycodes/ng-diagram-av-schematic |
| Assembly Line | Production-line monitor: Edit/Monitor modes, live data feed, KPI badges and sparklines, export to PNG, SVG and DXF | https://github.com/synergycodes/ng-diagram-assembly-line |

## Install the ng-diagram docs MCP server

The `@ng-diagram/mcp` server gives AI agents four tools: `search_docs`, `get_doc`, `search_symbols` and `get_symbol`. Nothing to install: the agent starts it with `npx -y @ng-diagram/mcp`. Most agents take this entry:

```json
{
  "mcpServers": {
    "ng-diagram-docs": {
      "command": "npx",
      "args": ["-y", "@ng-diagram/mcp"]
    }
  }
}
```

| Agent | Where the entry goes |
| --- | --- |
| Claude Code | `.mcp.json` in the project root. For all projects: `claude mcp add --scope user ng-diagram-docs -- npx -y @ng-diagram/mcp` |
| Cursor | `.cursor/mcp.json` in the project, or `~/.cursor/mcp.json` |
| VS Code (Copilot) | `.mcp.json` in the project root. `.vscode/mcp.json` takes the same entry under `"servers"` instead of `"mcpServers"` |
| Gemini CLI | `.gemini/settings.json` in the project, or `~/.gemini/settings.json` |
| Codex | `~/.codex/config.toml` (or `.codex/config.toml` in a trusted project) as TOML, below. Or: `codex mcp add ng-diagram-docs -- npx -y @ng-diagram/mcp` |

```toml
[mcp_servers.ng-diagram-docs]
command = "npx"
args = ["-y", "@ng-diagram/mcp"]
```

If the server does not start on Windows, run `npx` through `cmd`: command `cmd`, args `["/c", "npx", "-y", "@ng-diagram/mcp"]`.

Restart the agent, then test it with a request like "Search the ng-diagram docs for palette". The docs and API data are bundled in the npm package (no network calls at query time), so they can describe a newer ng-diagram than the installed one: check `@since` tags. More: https://www.ngdiagram.dev/docs/intro/ai/

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Nodes render as plain unstyled boxes or text | `styles.css` not imported, or imported in a component: import it in the global stylesheet. |
| Empty area, nothing visible, no console error | The parent of `<ng-diagram>` has no height: give it an explicit size. |
| ``NgDiagram services are not available. Please register all required services using `provideNgDiagram()` in your component's providers array.`` | No `provideNgDiagram()` above `<ng-diagram>`: add it to the component that renders the diagram. |
| `NullInjectorError: No provider for NgDiagramService!` (or another `NgDiagram*Service`) in a toolbar, sidebar or service | That code is outside the registration: move `provideNgDiagram()` to a common ancestor, see `ng-diagram-fundamentals`. |
| `[ngDiagram] Library engine not initialized yet.` | A service method ran before `<ng-diagram>` created its engine: see `ng-diagram-model-init`. |
| Two diagrams show the same content, interfere, or one turns empty | They share one registration: one `provideNgDiagram()` per diagram component. |
| Content placed inside `<ng-diagram>` does not show | Only `<ng-diagram-background>` is projected: put overlays next to it. |
| `tabindex` on `<ng-diagram>` has no effect | Since 1.4.0 the diagram sets it: use `[tabbable]="false"`. |
| `updateConfig()` does not hide or move the watermark | Watermark keys are read from `[config]` only. |
| Ports stay at old positions and `[ngDiagram] Node measurement failed: Node element not found.` appears (diagram in `ngTemplateOutlet`, portal or overlay) | Fixed in 1.4.0: upgrade. |
| Diagram shows up only after 2 to 4 s, with `[InitUpdater] Measurement timeout reached` | Some elements cannot be measured: see `ng-diagram-model-init`. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
