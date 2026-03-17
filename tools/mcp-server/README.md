# ng-diagram MCP Server

> **MCP server that enables AI assistants to search ng-diagram documentation and public API**

An [MCP](https://modelcontextprotocol.io) server that provides intelligent documentation search and API symbol lookup for [ng-diagram](https://www.npmjs.com/package/ng-diagram) - an Angular library for building interactive diagrams. Connect it to AI assistants like Claude, Cursor, or any MCP-compatible tool and ask questions like:

- _"How do I create custom nodes in ng-diagram?"_
- _"What's the signature of the `DiagramComponent` class?"_
- _"What config options does ng-diagram support?"_

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

Search through ng-diagram documentation sections. Returns full section content split by `##` headings. Supports exact phrases, multi-word queries, and individual keywords.

**Parameters:**

- `query` (string, required): Search query to find relevant documentation
- `limit` (number, optional): Max results to return (default: 10)

### Tool: `get_doc`

Retrieve the full content of a documentation page by its path. Returns the complete markdown body with frontmatter stripped.

**Parameters:**

- `path` (string, required): Relative path from docs root (e.g., `"guides/palette.mdx"`). Use paths from `search_docs` results.

### Tool: `search_symbols`

Search through ng-diagram public API symbols (classes, functions, interfaces, types, constants, enums).

**Parameters:**

- `query` (string, required): Search query (e.g., `"Diagram"`, `"provideNg"`, `"Edge"`)
- `kind` (string, optional): Filter by symbol kind (`class`, `function`, `interface`, `type`, `const`, `enum`)
- `limit` (number, optional): Max results to return (default: 10)

### Tool: `get_symbol`

Retrieve full API details for a specific ng-diagram symbol by exact name. Returns kind, full signature, jsDoc (if available), and a ready-to-use import statement.

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

**Finished and built with ❤️ by the Synergy Codes team**
