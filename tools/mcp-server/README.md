# ng-diagram MCP Server

An MCP (Model Context Protocol) server that provides documentation search capabilities for the ng-diagram library.

## Overview

This server exposes a `search_docs` tool that allows MCP-compatible clients (like Claude) to search through the ng-diagram documentation. The server indexes documentation files on startup and provides fast, relevant search results.

## Features

- **Documentation Search**: Search across titles, descriptions, and content
- **Relevance Ranking**: Results ranked by match location (title > description > content)
- **Context Excerpts**: Relevant text snippets showing match context
- **MCP Protocol**: Standard MCP protocol via stdio transport

## Installation

Install dependencies using pnpm:

```bash
cd tools/mcp-server
pnpm install
```

## Usage

### Running the Server

For development with auto-reload:

```bash
pnpm dev
```

For production:

```bash
pnpm build
node dist/index.js
```

### MCP Configuration

Add this server to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "ng-diagram-docs": {
      "command": "node",
      "args": ["/path/to/tools/mcp-server/dist/index.js"],
      "cwd": "/path/to/ng-diagram"
    }
  }
}
```

Or for development:

```json
{
  "mcpServers": {
    "ng-diagram-docs": {
      "command": "pnpm",
      "args": ["--dir", "tools/mcp-server", "dev"],
      "cwd": "/path/to/ng-diagram"
    }
  }
}
```

## Available Tools

### search_docs

Search through ng-diagram documentation.

**Parameters:**

- `query` (string, required): Search query to find relevant documentation
- `limit` (number, optional): Maximum number of results to return (default: 10)

**Example:**

```json
{
  "query": "palette drag and drop",
  "limit": 5
}
```

**Response:**

```json
{
  "results": [
    {
      "path": "guides/palette.mdx",
      "title": "Palette",
      "description": "Learn how to use the palette component",
      "excerpt": "...drag and drop items from the palette...",
      "url": "/docs/guides/palette"
    }
  ]
}
```

## Development

### Running Tests

Run all tests:

```bash
pnpm test
```

Run tests with coverage:

```bash
pnpm test:coverage
```

Run tests in watch mode:

```bash
pnpm test:watch
```

### Building

Build the TypeScript code:

```bash
pnpm build
```

## Architecture

The server consists of several key components:

- **MCP Server**: Handles MCP protocol communication via stdio
- **Documentation Indexer**: Scans and indexes documentation files on startup
- **Search Engine**: Processes queries and returns ranked results
- **Tool Handler**: Implements the `search_docs` tool interface

## Requirements

- Node.js 18+
- pnpm (for development)

## License

MIT
