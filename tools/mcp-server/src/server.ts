import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type ListToolsRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { ApiReportIndexer } from './services/api-indexer.js';
import { DocumentationIndexer } from './services/indexer.js';
import { SearchEngine } from './services/search.js';
import { SymbolSearchEngine } from './services/symbol-search.js';
import { GET_DOC_TOOL, createGetDocHandler, type GetDocInput } from './tools/get-doc/index.js';
import { SEARCH_DOCS_TOOL, createSearchDocsHandler, type SearchDocsInput } from './tools/search-docs/index.js';
import { GET_SYMBOL_TOOL, createGetSymbolHandler, type GetSymbolInput } from './tools/get-symbol/index.js';
import {
  SEARCH_SYMBOLS_TOOL,
  createSearchSymbolsHandler,
  type SearchSymbolsInput,
} from './tools/search-symbols/index.js';
import type { MCPServerConfig } from './types/index.js';

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
    });

    this.server.onerror = (error) => {
      console.error('[MCP Server Error]:', error);
    };

    process.on('SIGINT', this.onSigInt);
    process.on('SIGTERM', this.onSigTerm);
  }

  /**
   * Starts the MCP server
   * Initializes the documentation index and starts listening for requests
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

  private registerTools(): void {
    if (!this.searchEngine) {
      throw new Error('Search engine not initialized. Call start() first.');
    }

    const searchHandler = createSearchDocsHandler(this.searchEngine);
    const getDocHandler = createGetDocHandler(this.indexer);
    const searchSymbolsHandler = this.symbolSearch ? createSearchSymbolsHandler(this.symbolSearch) : null;
    const getSymbolHandler = this.apiIndexer ? createGetSymbolHandler(this.apiIndexer) : null;

    // Map tool names to their handlers
    const toolHandlers = new Map<string, (args: unknown) => Promise<unknown>>();
    toolHandlers.set('search_docs', (args) => searchHandler(args as SearchDocsInput));
    toolHandlers.set('get_doc', (args) => getDocHandler(args as GetDocInput));
    if (searchSymbolsHandler) {
      toolHandlers.set('search_symbols', (args) => searchSymbolsHandler(args as SearchSymbolsInput));
    }
    if (getSymbolHandler) {
      toolHandlers.set('get_symbol', (args) => getSymbolHandler(args as GetSymbolInput));
    }

    const toolDefinitions: object[] = [SEARCH_DOCS_TOOL, GET_DOC_TOOL];
    if (searchSymbolsHandler) {
      toolDefinitions.push(SEARCH_SYMBOLS_TOOL);
    }
    if (getSymbolHandler) {
      toolDefinitions.push(GET_SYMBOL_TOOL);
    }

    this.server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => {
      return { tools: toolDefinitions };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;

      const handler = toolHandlers.get(name);
      if (!handler) {
        throw new Error(`Unknown tool: ${name}`);
      }

      return callTool(handler, args);
    });

    console.error(`[MCP Server] Registered tools: ${[...toolHandlers.keys()].join(', ')}`);
  }

  private async shutdown(): Promise<void> {
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
    process.exit(0);
  }

  isServerRunning(): boolean {
    return this.isRunning;
  }
}
