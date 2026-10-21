# ngDiagram agent skills (preview)

Skills that help AI coding agents build applications with the [ngDiagram](https://www.ngdiagram.dev/docs) Angular library: diagram editors, org charts, workflow builders, schematics. They cover the common use cases, the edge cases that cause most bugs, and troubleshooting from a symptom or a console message.

The skills use the open [Agent Skills](https://agentskills.io) format, so they work in Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI and other agents that read `SKILL.md` files. They are for people who build applications with the library, not for work on the library itself.

> **Preview.** The skills are written for ngDiagram **1.4.0**. Features added after 1.0.0 are marked "since vX.Y", and every skill tells the agent to check the installed version and to confirm API names in `node_modules/ng-diagram/ng-diagram.d.ts` before it writes code. If a skill gives wrong advice, please [tell us](#report-wrong-advice).

## Install

With the [`skills`](https://github.com/vercel-labs/skills) CLI (Node.js 22.20 or newer), in your project folder:

```bash
npx skills add https://github.com/synergycodes/ng-diagram/tree/release/skills
```

It asks which agents to install the skills for. Useful options:

- `-a codex -a claude-code`: choose the agents
- `-g`: install for all your projects instead of this one
- `--list`: only show the skills
- `--skill ng-diagram-linking`: install one skill

Update later with `npx skills update`. The CLI sends anonymous usage data; set `DISABLE_TELEMETRY=1` to turn it off.

Or copy the skill folders yourself to the folder your agent reads: `.claude/skills/` for Claude Code, `.agents/skills/` for Codex. The `skills` CLI uses `.agents/skills/` for Cursor, GitHub Copilot, Gemini CLI and OpenCode too.

**Recommended:** also add the ngDiagram docs MCP server, so the agent can search the documentation and the API reference. Setup for each agent: [ngdiagram.dev/docs/intro/ai](https://www.ngdiagram.dev/docs/intro/ai/) and the `ng-diagram-setup` skill.

## How the agent uses the skills

The agent loads a skill when your request matches its description. You can also ask for a skill by name, for example "use the ng-diagram-visibility skill". `ng-diagram-fundamentals` is the starting point: it explains how the library works, lists the rules that prevent most bugs, and maps every topic to its skill. `ng-diagram-troubleshooting` is the starting point for problems.

Agents show all skill descriptions in a list with limited space: Claude Code uses 1% of the context window, Codex 2% (both fall back to 8,000 characters). The 31 descriptions take about 7,200 characters. With many other skills installed, an agent can drop some descriptions from the list; you can still ask for those skills by name.

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

## Report wrong advice

Open an issue with the [agent skill feedback form](https://github.com/synergycodes/ng-diagram/issues/new?template=skill-feedback.yml). It asks for the skill, your prompt, the agent, what happened, what you expected and your ngDiagram version.

## License

Apache-2.0, the same as ngDiagram.
