import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { ApiReportIndexer } from './services/api-indexer.js';
import { DocumentationIndexer } from './services/indexer.js';
import { SearchEngine } from './services/search.js';
import { SymbolSearchEngine } from './services/symbol-search.js';
import { GET_DOC_TOOL, createGetDocHandler } from './tools/get-doc/index.js';
import { SEARCH_DOCS_TOOL, createSearchDocsHandler } from './tools/search-docs/index.js';
import { GET_SYMBOL_TOOL, createGetSymbolHandler } from './tools/get-symbol/index.js';
import { SEARCH_SYMBOLS_TOOL, createSearchSymbolsHandler } from './tools/search-symbols/index.js';
import type { MCPServerConfig } from './types/index.js';

/**
 * Execute a tool handler and wrap the result in the MCP response format.
 *
 * On success, returns `{ content: [{ type: "text", text: <JSON> }] }`.
 * On failure (including invalid args), returns the same shape with `isError: true`.
 * This ensures all tool errors are surfaced uniformly to the MCP client.
 *
 * @param handler The tool handler to invoke (validates its own input via Zod)
 * @param args Raw arguments from the MCP CallToolRequest
 */
async function callTool(handler: (args: unknown) => Promise<unknown>, args: unknown) {
  try {
    if (args === undefined || args === null || typeof args !== 'object') {
      throw new Error('Invalid arguments: expected an object');
    }
    const result = await handler(args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }, null, 2),
        },
      ],
      isError: true,
    };
  }
}

/**
 * MCP server for ng-diagram documentation and API symbol search.
 *
 * On {@link start}, the server:
 * 1. Indexes documentation files into searchable sections
 * 2. Optionally parses an API Extractor report into searchable symbols
 * 3. Registers four MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`)
 * 4. Connects via stdio transport
 *
 * The server listens for SIGINT/SIGTERM and cleans up via {@link shutdown}.
 * Process exit is **not** performed by this class — the caller (entry point)
 * is responsible for calling `process.exit()` after shutdown if needed.
 */
export class NgDiagramMCPServer {
  private config: MCPServerConfig;
  private server: Server;
  private indexer: DocumentationIndexer;
  private apiIndexer: ApiReportIndexer | null = null;
  private searchEngine: SearchEngine | null = null;
  private symbolSearch: SymbolSearchEngine | null = null;
  private isRunning = false;
  private readonly onSigInt = () => void this.shutdown();
  private readonly onSigTerm = () => void this.shutdown();

  /**
   * Create the server instance and wire up signal handlers.
   * Does not start listening — call {@link start} for that.
   * @param config Server name, version, docs path, base URL, and optional API report path
   */
  constructor(config: MCPServerConfig) {
    this.config = config;

    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.indexer = new DocumentationIndexer({
      docsPath: config.docsPath,
      extensions: ['.md', '.mdx'],
      baseUrl: config.baseUrl,
      examplesPath: config.examplesPath,
    });

    this.server.onerror = (error) => {
      console.error('[MCP Server Error]:', error);
    };

    process.on('SIGINT', this.onSigInt);
    process.on('SIGTERM', this.onSigTerm);
  }

  /**
   * Build indexes, register tools, and start listening on stdio.
   * Throws if the server is already running or if indexing/connection fails.
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    try {
      console.error(`[MCP Server] Starting ${this.config.name} v${this.config.version}...`);

      // Build documentation index
      console.error(`[MCP Server] Indexing documentation from: ${this.config.docsPath}`);
      const sections = await this.indexer.buildIndex();
      console.error(`[MCP Server] Indexed ${sections.length} sections`);

      // Build API report index
      if (this.config.apiReportPath) {
        this.apiIndexer = new ApiReportIndexer(this.config.apiReportPath);
        const apiSymbols = await this.apiIndexer.buildIndex();
        console.error(`[MCP Server] Indexed ${apiSymbols.length} API symbols`);

        this.symbolSearch = new SymbolSearchEngine(apiSymbols);
      }

      // Initialize search engine
      this.searchEngine = new SearchEngine(sections);

      // Register tools
      this.registerTools();

      // Start server with stdio transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      this.isRunning = true;
      console.error('[MCP Server] Server started successfully');
    } catch (error) {
      console.error('[MCP Server] Failed to start server:', error instanceof Error ? error.message : error);
      throw error;
    }
  }

  /**
   * Create tool handlers and register MCP request handlers for
   * `ListTools` and `CallTool`. API symbol tools (`search_symbols`,
   * `get_symbol`) are only registered when an API report was configured.
   *
   * Must be called after the search engines are initialized.
   */
  private registerTools(): void {
    if (!this.searchEngine) {
      throw new Error('Search engine not initialized. Call start() first.');
    }

    const searchHandler = createSearchDocsHandler(this.searchEngine);
    const getDocHandler = createGetDocHandler(this.indexer);
    const searchSymbolsHandler = this.symbolSearch ? createSearchSymbolsHandler(this.symbolSearch) : null;
    const getSymbolHandler = this.apiIndexer ? createGetSymbolHandler(this.apiIndexer) : null;

    // Map tool names to their handlers (all accept unknown and validate via Zod internally)
    const toolHandlers = new Map<string, (args: unknown) => Promise<unknown>>();
    toolHandlers.set('search_docs', searchHandler);
    toolHandlers.set('get_doc', getDocHandler);
    if (searchSymbolsHandler) {
      toolHandlers.set('search_symbols', searchSymbolsHandler);
    }
    if (getSymbolHandler) {
      toolHandlers.set('get_symbol', getSymbolHandler);
    }

    const toolDefinitions: object[] = [SEARCH_DOCS_TOOL, GET_DOC_TOOL];
    if (searchSymbolsHandler) {
      toolDefinitions.push(SEARCH_SYMBOLS_TOOL);
    }
    if (getSymbolHandler) {
      toolDefinitions.push(GET_SYMBOL_TOOL);
    }

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: toolDefinitions };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;

      const handler = toolHandlers.get(name);
      if (!handler) {
        return callTool(() => Promise.reject(new Error(`Unknown tool: ${name}`)), args);
      }

      return callTool(handler, args);
    });

    console.error(`[MCP Server] Registered tools: ${[...toolHandlers.keys()].join(', ')}`);
  }

  /**
   * Gracefully shut down the server.
   * Removes signal listeners, closes the MCP connection, and marks the
   * server as stopped. Safe to call multiple times (no-op if already stopped).
   */
  async shutdown(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.error('[MCP Server] Shutting down...');
    this.isRunning = false;

    process.removeListener('SIGINT', this.onSigInt);
    process.removeListener('SIGTERM', this.onSigTerm);

    try {
      await this.server.close();
    } catch {
      // Ignore close errors during shutdown
    }

    console.error('[MCP Server] Server stopped');
  }

  /** @returns `true` if the server has been started and not yet shut down */
  isServerRunning(): boolean {
    return this.isRunning;
  }
}
