# MCP Documentation Server - User & Developer Guide

An MCP (Model Context Protocol) server that gives AI assistants instant access to your library's documentation and public API. Built for [Astro Starlight](https://starlight.astro.build/) docs and [API Extractor](https://api-extractor.com/) reports.

---

## Table of Contents

- [For Users](#for-users)
  - [What It Does](#what-it-does)
  - [Setup](#setup)
  - [Available Tools](#available-tools)
  - [Example Workflows](#example-workflows)
- [For Developers - Adapting to Your Library](#for-developers--adapting-to-your-library)
  - [Prerequisites](#prerequisites)
  - [Architecture Overview](#architecture-overview)
  - [Step-by-Step Adaptation Guide](#step-by-step-adaptation-guide)
  - [How Indexing Works](#how-indexing-works)
  - [How Search Works](#how-search-works)
  - [Security Model](#security-model)
  - [Testing](#testing)

---

## For Users

### What It Does

This server connects your AI assistant (Claude, Cursor, Windsurf, or any MCP client) to your library's documentation. Instead of switching to a browser and searching docs manually, you ask your AI assistant directly:

- _"How do I create custom nodes?"_
- _"What's the signature of `DiagramComponent`?"_
- _"Show me the palette guide"_

The AI searches the docs behind the scenes and answers with the actual documentation content.

### Setup

#### Option A: npx (recommended)

No installation needed - just add the server to your MCP client config:

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

This downloads and runs the latest version automatically. The package includes all documentation and API data - no monorepo checkout required.

#### Option B: Local development (monorepo)

If you're working within the ng-diagram monorepo:

**1. Install and build:**

```bash
cd tools/mcp-server
pnpm install
pnpm build
```

**2. Configure your MCP client:**

```json
{
  "mcpServers": {
    "ng-diagram-docs": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/tools/mcp-server/dist/index.js"]
    }
  }
}
```

#### MCP client config file locations

| Client         | Config file                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code    | `.mcp.json` in project root (project) or `~/.claude.json` (user)                                                                                                                                  |
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS), `%APPDATA%\Claude\claude_desktop_config.json` (Windows), `~/.config/claude-desktop/claude_desktop_config.json` (Linux) |
| Cursor         | `.cursor/mcp.json` in project root (project) or `~/.cursor/mcp.json` (global)                                                                                                                     |
| Windsurf       | `~/.codeium/windsurf/mcp_config.json`                                                                                                                                                             |

**Restart your AI assistant** after updating the config, then verify by asking: _"Search the ng-diagram docs for palette"_

### Available Tools

The server exposes four tools to the AI assistant:

#### `search_docs`

Searches documentation sections by keyword. Returns matching sections with titles, content, paths, and URLs.

| Parameter | Type   | Required | Description                                          |
| --------- | ------ | -------- | ---------------------------------------------------- |
| `query`   | string | yes      | Search keywords (e.g., `"palette"`, `"custom edge"`) |
| `limit`   | number | no       | Max results (default: 10, max: 100)                  |

#### `get_doc`

Retrieves the full content of a documentation page by its path (returned from `search_docs`).

| Parameter | Type   | Required | Description                                                 |
| --------- | ------ | -------- | ----------------------------------------------------------- |
| `path`    | string | yes      | Relative path from docs root (e.g., `"guides/palette.mdx"`) |

#### `search_symbols`

Searches public API symbols (classes, interfaces, functions, types, constants, enums).

| Parameter | Type   | Required | Description                                                       |
| --------- | ------ | -------- | ----------------------------------------------------------------- |
| `query`   | string | yes      | Symbol name or partial name (e.g., `"Diagram"`, `"Edge"`)         |
| `kind`    | string | no       | Filter: `class`, `function`, `interface`, `type`, `const`, `enum` |
| `limit`   | number | no       | Max results (default: 10, max: 100)                               |

#### `get_symbol`

Retrieves full details for a specific API symbol by exact name (returned from `search_symbols`).

| Parameter | Type   | Required | Description                       |
| --------- | ------ | -------- | --------------------------------- |
| `name`    | string | yes      | Exact, case-sensitive symbol name |

### Example Workflows

**Discover → Read:**

1. AI calls `search_docs("palette")` → gets matching sections with `path` values
2. AI calls `get_doc("guides/palette.mdx")` → gets the full page content
3. AI synthesizes the answer for you

**API Lookup:**

1. AI calls `search_symbols("Component", kind: "class")` → gets matching class names
2. AI calls `get_symbol("NgDiagramComponent")` → gets full signature and import statement
3. AI provides the exact type information you need

---

## For Developers - Adapting to Your Library

If your library uses **Astro Starlight** for docs (or any markdown-based docs with YAML frontmatter) and optionally **API Extractor** for API reports, you can adapt this server with minimal changes.

### Prerequisites

The indexer recursively scans any directory for `.md`/`.mdx` files - no specific folder structure is required. Organize your docs however you like.

Files optionally have YAML frontmatter for `title` and `description`. If frontmatter is missing, the filename is used as the title (e.g. `getting-started.mdx` → "Getting Started").

```yaml
---
title: Getting Started
description: How to set up the library
---

Your markdown content here...

## First Section

Content under first heading...

## Second Section

Content under second heading...
```

The indexer splits pages on `##` headings to create searchable sections. `###` and deeper headings stay within their parent section. Files starting with `_` (e.g. `_meta.yml`) are skipped.

For API symbol search, you need an [API Extractor](https://api-extractor.com/) report (`.api.md` file). This is optional - the server works without it, just without the `search_symbols` and `get_symbol` tools.

### Architecture Overview

```
src/
├── index.ts                  # Entry point - resolve paths, start server
├── server.ts                 # MCP protocol wiring - tool registration, stdio transport
├── services/
│   ├── indexer.ts            # Scans docs directory, parses frontmatter, splits sections
│   ├── search.ts             # MiniSearch index over documentation sections
│   ├── api-indexer.ts        # Parses API Extractor .api.md report
│   └── symbol-search.ts     # MiniSearch index over API symbols
└── tools/
    ├── search-docs/          # Each tool has 5 files:
    │   ├── index.ts          #   Barrel exports
    │   ├── handler.ts        #   Business logic (factory function)
    │   ├── tool.config.ts    #   MCP tool schema definition
    │   ├── tool.types.ts     #   Input/output TypeScript types
    │   └── tool.validator.ts #   Zod input validation schema
    ├── get-doc/
    ├── search-symbols/
    └── get-symbol/
```

**Data flow at startup:**

```
Docs directory (.md/.mdx files)
  → DocumentationIndexer scans and parses
  → Sections stored in memory (page map + flat section list)
  → SearchEngine builds MiniSearch index from sections

API report (.api.md file)       [optional]
  → ApiReportIndexer parses TypeScript code block
  → Symbols stored in memory (array + name→symbol map)
  → SymbolSearchEngine builds MiniSearch index from symbols
```

**Data flow at query time:**

```
MCP client sends CallToolRequest
  → server.ts routes to the correct handler by tool name
  → Handler validates input with Zod
  → Handler calls service (search engine or indexer)
  → Result returned as JSON via stdio
```

### Step-by-Step Adaptation Guide

#### 1. Fork or copy `tools/mcp-server/`

Copy the entire directory into your project.

#### 2. Update `package.json`

Change the package name and description:

```json
{
  "name": "@your-lib/mcp-server",
  "description": "MCP server for your-lib documentation search"
}
```

#### 3. Update `src/index.ts` - paths and config

This is the main file you need to change. Update three things:

```typescript
// 1. Point to YOUR docs directory (relative to dist/index.js at runtime)
const docsPath = resolve(__dirname, '../path/to/your/docs');

// 2. Point to YOUR API report (or remove if you don't use API Extractor)
const apiReportPath = resolve(__dirname, '../path/to/your-lib.api.md');

// 3. Update server config
const server = new NgDiagramMCPServer({
  name: 'your-lib-docs', // Server name shown to MCP clients
  version: pkg.version,
  docsPath,
  baseUrl: 'https://your-docs-site.dev', // Your documentation site URL
  apiReportPath, // Remove this line if no API report
});
```

#### 4. Update tool descriptions in `tool.config.ts` files

Each tool has a `tool.config.ts` with a `description` string. Update these to reference your library name:

- `tools/search-docs/tool.config.ts` - mention your library and typical search terms
- `tools/get-doc/tool.config.ts` - mention your docs structure
- `tools/search-symbols/tool.config.ts` - mention your library's API
- `tools/get-symbol/tool.config.ts` - mention your library name

These descriptions are what AI clients see when deciding which tool to call, so make them specific and helpful.

#### 5. Update `.mcp.json`

```json
{
  "mcpServers": {
    "your-lib-docs": {
      "type": "stdio",
      "command": "node",
      "args": ["path/to/mcp-server/dist/index.js"]
    }
  }
}
```

#### 6. If you don't use API Extractor

Remove `apiReportPath` from the config in `index.ts`. The server automatically skips API symbol tools when no report path is configured - no other changes needed.

If you want to remove the API code entirely, delete:

- `src/services/api-indexer.ts`
- `src/services/symbol-search.ts`
- `src/tools/search-symbols/`
- `src/tools/get-symbol/`
- Related imports in `server.ts`
- Related types in `src/types/`

#### 7. Build and test

```bash
pnpm install
pnpm test    # Run tests to make sure everything works
pnpm build   # Compile TypeScript
```

### How Indexing Works

#### Documentation Indexer (`services/indexer.ts`)

1. **Scans** the docs directory recursively for `.md` and `.mdx` files
2. **Skips** symbolic links (prevents directory cycles)
3. **Parses** YAML frontmatter with [gray-matter](https://github.com/jonschlinkert/gray-matter) to extract `title` and `description`
4. **Falls back** to filename-as-title if frontmatter is missing or malformed
5. **Splits** each page into sections on `##` headings:
   - Content before the first `##` becomes an "Introduction" section
   - Each `##` heading starts a new section
   - `###` and deeper headings stay within their parent `##` section
   - Pages without `##` headings produce a single section
6. **Generates URLs** from file paths: `guides/palette.mdx` → `https://your-site.dev/docs/guides/palette`
7. **Stores** two data structures:
   - Page map (path → full page data) for `get_doc`
   - Flat section list for search indexing

**Astro Starlight compatibility:** The indexer reads the raw `.md`/`.mdx` source files, not the built HTML. It strips frontmatter and ignores Astro/MDX component imports (they appear as plain text in search results but don't break anything). The URL generation follows Starlight's default `/docs/` prefix routing.

#### API Report Indexer (`services/api-indexer.ts`)

1. **Reads** the `.api.md` file generated by API Extractor
2. **Extracts** the TypeScript code block (` ```ts ... ``` `)
3. **Walks** line-by-line, tracking visibility tags (`// @public`, `// @internal`, `// @deprecated`)
4. **Collects** exported declarations: `interface`, `class`, `function`, `type`, `const`, `enum`
5. **Handles** re-export aliases (`export { Node_2 as Node }`)
6. **Cleans** Angular compiler artifacts (`static ɵcmp`, `static ɵfac`) - if your library isn't Angular, these are simply no-ops
7. **Stores** symbols in both an array (for search) and a Map (for exact-name lookup)

### How Search Works

Both search engines use [MiniSearch](https://lucaong.github.io/minisearch/), a lightweight in-memory full-text search library.

**Documentation search:**

- Fields indexed: `pageTitle`, `sectionTitle`, `content`, `description`
- Boosting: section title (10x) > page title (5x) > description (2x) > content (1x)
- Features: prefix matching, fuzzy matching (edit distance 0.2)

**Symbol search:**

- Fields indexed: `name`, `signature`
- Boosting: name (10x) > signature (1x)
- Custom tokenizer splits camelCase/PascalCase boundaries so that searching "Component" matches "DiagramComponent". The full original token is kept alongside the parts so exact matches still rank highest.
- Post-search filtering by symbol `kind`

Both engines handle empty/whitespace queries gracefully (return empty results). All string inputs are trimmed before processing.

### Security Model

The server is **read-only** and designed to be safe:

- **No arbitrary file access** - `get_doc` only returns pages from the pre-built index, not files from disk
- **Path traversal protection** - Zod validation rejects `..`, absolute paths, and null bytes in `get_doc` path input
- **Input length limits** - all string inputs are capped (query: 1000 chars, path: 500 chars, name: 200 chars)
- **Result limits** - search results capped at 100 per request
- **No network calls** - everything is local file I/O at startup, then in-memory at query time
- **Symbolic links skipped** - prevents following links outside the docs directory
- **stdio transport** - no HTTP server, no exposed ports, no authentication needed
- **Logging to stderr** - stdout is reserved for the MCP protocol; log messages never leak into responses

### Testing

```bash
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
```

Tests create ephemeral fixture files in `beforeEach` and clean up in `afterEach` - no stale fixtures to maintain.

When adapting, update the integration test paths and fixture content to match your library's docs structure.

---

## Quick Reference - What to Change

| What                  | File                          | Change                                                                 |
| --------------------- | ----------------------------- | ---------------------------------------------------------------------- |
| Docs path             | `src/index.ts`                | Point `docsPath` to your docs directory                                |
| API report path       | `src/index.ts`                | Point `apiReportPath` to your `.api.md` or remove it                   |
| Base URL              | `src/index.ts`                | Set `baseUrl` to your documentation site URL                           |
| Server name           | `src/index.ts`                | Change `name` to your library name                                     |
| Tool descriptions     | `src/tools/*/tool.config.ts`  | Reference your library name and typical queries                        |
| Package name          | `package.json`                | Change `name` to `@your-lib/mcp-server`                                |
| MCP config            | `.mcp.json`                   | Update server name and path                                            |
| Import path (symbols) | `src/services/api-indexer.ts` | Change `IMPORT_PATH` constant from `'ng-diagram'` to your package name |
