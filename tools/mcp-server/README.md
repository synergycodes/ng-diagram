# ng-diagram MCP Server

An MCP (Model Context Protocol) server that provides documentation search capabilities for the ng-diagram library.

## Overview

This server exposes a `search_docs` tool that allows MCP-compatible clients (like Claude) to search through the ng-diagram documentation. The server indexes documentation files on startup and provides fast, relevant search results.

### Purpose

The ng-diagram MCP server enables AI assistants and other MCP-compatible tools to:

- Search through ng-diagram documentation efficiently
- Find relevant guides, API references, and examples
- Access documentation context without manual browsing
- Integrate documentation search into AI-assisted workflows

This is a proof-of-concept implementation demonstrating core MCP server functionality with a simple, maintainable design suitable for local development and testing.

## Features

- **Documentation Search**: Search across titles, descriptions, and content
- **Relevance Ranking**: Results ranked by match location (title > description > content)
- **Context Excerpts**: Relevant text snippets showing match context
- **MCP Protocol**: Standard MCP protocol via stdio transport
- **Fast Indexing**: In-memory index built on startup for quick searches
- **Error Handling**: Graceful handling of missing files and parsing errors

## Installation

### Prerequisites

- Node.js 18 or higher
- pnpm (recommended) or npm

### Install Dependencies

From the repository root:

```bash
cd tools/mcp-server
pnpm install
```

Or using npm:

```bash
cd tools/mcp-server
npm install
```

## Usage

### Running the Server

#### Development Mode

For development with auto-reload using tsx:

```bash
pnpm dev
```

This will start the server and automatically restart when source files change.

#### Production Mode

First build the TypeScript code:

```bash
pnpm build
```

Then run the compiled JavaScript:

```bash
node dist/index.js
```

### MCP Client Configuration

To use this server with an MCP-compatible client, add it to your client's configuration file.

#### Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or equivalent:

**Using built version (recommended for production):**

```json
{
  "mcpServers": {
    "ng-diagram-docs": {
      "command": "node",
      "args": ["/absolute/path/to/ng-diagram/tools/mcp-server/dist/index.js"],
      "cwd": "/absolute/path/to/ng-diagram"
    }
  }
}
```

**Using development mode:**

```json
{
  "mcpServers": {
    "ng-diagram-docs": {
      "command": "pnpm",
      "args": ["--dir", "tools/mcp-server", "dev"],
      "cwd": "/absolute/path/to/ng-diagram"
    }
  }
}
```

**Note:** Replace `/absolute/path/to/ng-diagram` with the actual path to your ng-diagram repository.

#### Other MCP Clients

For other MCP-compatible clients, configure them to run:

```bash
node /path/to/tools/mcp-server/dist/index.js
```

with the working directory set to the ng-diagram repository root.

## MCP Tools Documentation

### search_docs

Search through ng-diagram documentation to find relevant guides, API references, and examples.

#### Parameters

| Parameter | Type   | Required | Default | Description                                 |
| --------- | ------ | -------- | ------- | ------------------------------------------- |
| `query`   | string | Yes      | -       | Search query to find relevant documentation |
| `limit`   | number | No       | 10      | Maximum number of results to return (1-100) |

#### Response Format

Returns an object containing an array of search results:

```typescript
{
  results: Array<{
    path: string; // Relative file path from docs root
    title: string; // Document title from frontmatter or filename
    description?: string; // Document description from frontmatter (if available)
    excerpt: string; // Text snippet showing match context
    url: string; // Documentation URL path
  }>;
}
```

#### Search Behavior

- **Case-insensitive**: Searches are not case-sensitive
- **Multi-field**: Searches across file paths, titles, descriptions, and content
- **Relevance ranking**: Results are ranked by match location:
  1. Title matches (highest priority)
  2. Description matches
  3. Content matches (lowest priority)
- **Context excerpts**: Each result includes a text snippet showing where the match occurred

#### Example Queries and Responses

##### Example 1: Basic Search

**Request:**

```json
{
  "query": "palette",
  "limit": 3
}
```

**Response:**

```json
{
  "results": [
    {
      "path": "guides/palette.mdx",
      "title": "Palette",
      "description": "Learn how to use the palette component for drag-and-drop node creation",
      "excerpt": "...The palette component provides a drag-and-drop interface for adding nodes to your diagram...",
      "url": "/docs/guides/palette"
    },
    {
      "path": "examples/palette.mdx",
      "title": "Palette Example",
      "description": "Interactive example demonstrating palette usage",
      "excerpt": "...This example shows how to configure a palette with custom node templates...",
      "url": "/docs/examples/palette"
    }
  ]
}
```

##### Example 2: API Search

**Request:**

```json
{
  "query": "node rotation",
  "limit": 5
}
```

**Response:**

```json
{
  "results": [
    {
      "path": "guides/nodes/rotation.mdx",
      "title": "Node Rotation",
      "description": "How to enable and configure node rotation",
      "excerpt": "...Nodes can be rotated by enabling the rotation feature. Use the rotation handle to rotate nodes interactively...",
      "url": "/docs/guides/nodes/rotation"
    },
    {
      "path": "api/Types/NodeModel.md",
      "title": "NodeModel",
      "description": "Node model interface definition",
      "excerpt": "...rotation?: number - The rotation angle of the node in degrees...",
      "url": "/docs/api/Types/NodeModel"
    }
  ]
}
```

##### Example 3: No Results

**Request:**

```json
{
  "query": "nonexistent feature",
  "limit": 10
}
```

**Response:**

```json
{
  "results": []
}
```

##### Example 4: Error - Empty Query

**Request:**

```json
{
  "query": "",
  "limit": 10
}
```

**Response:**

```json
{
  "error": "Query parameter cannot be empty"
}
```

## Development

### Project Structure

```
tools/mcp-server/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts             # MCP server implementation
│   ├── indexer.ts            # Documentation indexer
│   ├── search.ts             # Search engine
│   ├── tools/
│   │   └── search-docs/      # Search tool implementation
│   │       ├── handler.ts
│   │       ├── tool.config.ts
│   │       ├── tool.types.ts
│   │       └── tool.validator.ts
│   └── types/                # Shared type definitions
│       ├── config.types.ts
│       ├── document.types.ts
│       ├── search.types.ts
│       └── index.ts
├── tests/                    # Test files
├── dist/                     # Build output (generated)
├── package.json
├── tsconfig.json
└── README.md
```

### Running Tests

Run all tests:

```bash
pnpm test
```

Run tests with coverage:

```bash
pnpm test:coverage
```

Run tests in watch mode (for development):

```bash
pnpm test:watch
```

### Building

Build the TypeScript code to JavaScript:

```bash
pnpm build
```

The compiled output will be in the `dist/` directory.

### Code Quality

The project follows the ng-diagram monorepo standards:

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier (120 char width, single quotes)
- **Testing**: Vitest with 80%+ coverage target

### Making Changes

1. Make your changes in the `src/` directory
2. Run tests to ensure nothing breaks: `pnpm test`
3. Build to verify TypeScript compilation: `pnpm build`
4. Test manually by running the server: `pnpm dev`

## Architecture

The server consists of several key components working together:

### Components

1. **MCP Server (`server.ts`)**
   - Handles MCP protocol communication via stdio transport
   - Manages server lifecycle (startup, shutdown)
   - Registers and coordinates tools

2. **Documentation Indexer (`indexer.ts`)**
   - Scans `apps/docs/src/content/docs` directory recursively
   - Processes `.md` and `.mdx` files
   - Extracts frontmatter metadata (title, description)
   - Builds in-memory search index on startup

3. **Search Engine (`search.ts`)**
   - Performs case-insensitive text matching
   - Searches across paths, titles, descriptions, and content
   - Ranks results by relevance (title > description > content)
   - Extracts context excerpts around matches

4. **Tool Handler (`tools/search-docs/`)**
   - Implements the `search_docs` MCP tool interface
   - Validates input parameters
   - Formats results for MCP response
   - Handles errors gracefully

### Data Flow

```
Client Request
    ↓
MCP Server (stdio)
    ↓
Tool Handler (validation)
    ↓
Search Engine (query processing)
    ↓
Search Index (in-memory)
    ↓
Ranked Results
    ↓
MCP Response
```

### Indexing Process

On server startup:

1. Scan documentation directory recursively
2. Filter for `.md` and `.mdx` files
3. Read file content
4. Parse YAML frontmatter (title, description)
5. Generate documentation URL from file path
6. Store in in-memory index

### Search Process

On search request:

1. Validate query parameters
2. Perform case-insensitive matching across all fields
3. Calculate relevance scores based on match location
4. Sort results by score (descending)
5. Extract context excerpts
6. Apply limit and return results

## Requirements

- **Node.js**: 18 or higher
- **pnpm**: 10.8.1+ (recommended) or npm
- **Documentation**: ng-diagram docs must be present at `apps/docs/src/content/docs`

## Troubleshooting

### Server won't start

- Ensure Node.js 18+ is installed: `node --version`
- Verify dependencies are installed: `pnpm install`
- Check that you're running from the repository root or `tools/mcp-server`

### No search results

- Verify documentation exists at `apps/docs/src/content/docs`
- Check server logs for indexing errors
- Try a broader search query

### MCP client can't connect

- Verify the server path in your MCP client configuration is absolute
- Ensure the working directory (`cwd`) is set to the repository root
- Check that the server process starts without errors

## Future Enhancements

This is a proof-of-concept implementation. Potential future improvements:

- HTTP transport support for remote access
- Fuzzy matching and advanced search algorithms
- Persistent caching for faster startup
- Additional tools (get document content, list categories)
- Search filters by category or document type
- Syntax highlighting in excerpts

## License

MIT
