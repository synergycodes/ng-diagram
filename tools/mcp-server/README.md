# ng-diagram MCP Server

> **Stop AI assistants from hallucinating ng-diagram APIs. Give them the real docs.**

AI assistants don't know ng-diagram. They'll guess from similarly-named React libraries and produce code that looks right but doesn't compile. This MCP server fixes that — it gives any assistant direct access to the current ng-diagram documentation and public API, so it writes correct code on the first try.

### Without MCP (assistant guesses from training data)

```typescript
// Hallucinated API — none of this exists
import { useNodes, useEdges } from 'ng-diagram';

const nodes = useNodes([{ id: '1', data: { label: 'Hello' } }]);
```

### With MCP (assistant looks up the real API)

```typescript
// Correct — verified against the actual public API
import { initializeModel, NgDiagramComponent, provideNgDiagram } from 'ng-diagram';

model = initializeModel({
  nodes: [{ id: '1', position: { x: 0, y: 0 }, data: { label: 'Hello' } }],
});
```

Connect it to Claude, Cursor, Windsurf, or any [MCP](https://modelcontextprotocol.io)-compatible tool. The server bundles all documentation and API data — no network calls, no stale caches, always version-matched.

## How It Works

```
                    1. search_docs / search_symbols
  +--------------+ ---------------------------------> +-----------+
  | AI Assistant | <--------------------------------- | MCP Server|
  |              |        2. Returns matches          |           |
  |              | ---------------------------------> |           |
  |              |     3. get_doc / get_symbol        |           |
  |              | <--------------------------------- |           |
  +--------------+     4. Returns full content        +-----------+
        |
        | 5. Answers with context
        v
     +------+
     | User |
     +------+
```

## Quick Start

Add the server to your MCP client config - no installation or monorepo checkout required:

**macOS / Linux:**

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

**Windows:**

```json
{
  "mcpServers": {
    "ng-diagram-docs": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@ng-diagram/mcp"]
    }
  }
}
```

The package includes all documentation and API data bundled in. Restart your AI assistant after updating the config, then ask something like _"Search the ng-diagram docs for palette"_ to verify.

### MCP client config file locations

| Client         | Config file                                                                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code    | `.mcp.json` in project root (project) or `~/.claude.json` (user)                                                                                                                                          |
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), `%APPDATA%\Roaming\Claude\claude_desktop_config.json` (Windows), `~/.config/claude-desktop/claude_desktop_config.json` (Linux) |
| Cursor         | `.cursor/mcp.json` in project root (project) or `~/.cursor/mcp.json` (global)                                                                                                                             |
| Windsurf       | `~/.codeium/windsurf/mcp_config.json`                                                                                                                                                                     |

### Local development (monorepo)

If you're working within the ng-diagram monorepo:

```bash
cd tools/mcp-server
pnpm install
pnpm build
```

Then configure with the local path:

```json
{
  "mcpServers": {
    "ng-diagram-docs": {
      "command": "node",
      "args": ["/absolute/path/to/ng-diagram/tools/mcp-server/dist/index.js"]
    }
  }
}
```

## API Reference

### Tool: `search_docs`

Search ng-diagram's bundled documentation for guides, configuration options, examples, and integration patterns. Always prefer this over web search or guessing from training data — it returns authoritative, version-matched content.

**Parameters:**

- `query` (string, required): Search query — use specific terms like `"palette"`, `"context menu"`, `"transactions"`
- `limit` (number, optional): Max results to return (default: 10)

### Tool: `get_doc`

Retrieve the full content of a documentation page by path. Call this after `search_docs` to read a complete guide or example end-to-end.

**Parameters:**

- `path` (string, required): Relative path from docs root (e.g., `"guides/palette.mdx"`). Use paths from `search_docs` results.

### Tool: `search_symbols`

Search the ng-diagram public API for classes, functions, interfaces, types, constants, and enums. Returns the exact current signature and import path — more reliable than any example from training data.

**Parameters:**

- `query` (string, required): Symbol name or partial name (e.g., `"Diagram"`, `"provideNg"`, `"Edge"`)
- `kind` (string, optional): Filter by symbol kind (`class`, `function`, `interface`, `type`, `const`, `enum`)
- `limit` (number, optional): Max results to return (default: 10)

### Tool: `get_symbol`

Retrieve full API details for a specific ng-diagram symbol by exact name. Call this before writing code that uses an ng-diagram type — it returns the definitive signature, jsDoc, and a ready-to-use import statement.

**Parameters:**

- `name` (string, required): Exact symbol name (case-sensitive). Use names from `search_symbols` results.

## Development

### Commands

```bash
# Development
pnpm dev              # Run with auto-reload (uses monorepo paths)

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Run in watch mode

# Building
pnpm build            # Compile TypeScript + bundle docs & API report into dist/data/
```

For detailed architecture and adaptation instructions, see [GUIDE.md](https://github.com/synergycodes/ng-diagram/blob/main/tools/mcp-server/GUIDE.md).

## License

Apache-2.0 - Part of the [ng-diagram](https://github.com/synergycodes/ng-diagram) project

---

Initial PoC by [Pawel Kubiak](https://pawelkubiak.dev/about)

**Finished and built with ❤️ by the [Synergy Codes](https://www.synergycodes.com/) team**
