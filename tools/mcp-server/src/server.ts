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

export class NgDiagramMCPServer {
  private config: MCPServerConfig;
  private server: Server;
  private indexer: DocumentationIndexer;
  private apiIndexer: ApiReportIndexer | null = null;
  private searchEngine: SearchEngine | null = null;
  private symbolSearch: SymbolSearchEngine | null = null;
  private isRunning = false;

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

    process.on('SIGINT', () => {
      this.shutdown();
    });

    process.on('SIGTERM', () => {
      this.shutdown();
    });
  }

  /**
   * Starts the MCP server
   * Initializes the documentation index and starts listening for requests
   */
  async start(): Promise<void> {
    try {
      console.log(`[MCP Server] Starting ${this.config.name} v${this.config.version}...`);

      // Build documentation index
      console.log(`[MCP Server] Indexing documentation from: ${this.config.docsPath}`);
      const sections = await this.indexer.buildIndex();
      console.log(`[MCP Server] Indexed ${sections.length} sections`);

      // Build API report index
      if (this.config.apiReportPath) {
        this.apiIndexer = new ApiReportIndexer(this.config.apiReportPath);
        const apiSymbols = await this.apiIndexer.buildIndex();
        console.log(`[MCP Server] Indexed ${apiSymbols.length} API symbols`);

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
      console.log('[MCP Server] Server started successfully');
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

    this.server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => {
      const tools: object[] = [SEARCH_DOCS_TOOL, GET_DOC_TOOL];
      if (searchSymbolsHandler) {
        tools.push(SEARCH_SYMBOLS_TOOL);
      }
      if (getSymbolHandler) {
        tools.push(GET_SYMBOL_TOOL);
      }
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;

      if (name === 'search_docs') {
        try {
          const result = await searchHandler(args as unknown as SearchDocsInput);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error: error instanceof Error ? error.message : 'Unknown error occurred',
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      }

      if (name === 'search_symbols' && searchSymbolsHandler) {
        try {
          const result = await searchSymbolsHandler(args as unknown as SearchSymbolsInput);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error: error instanceof Error ? error.message : 'Unknown error occurred',
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      }

      if (name === 'get_symbol' && getSymbolHandler) {
        try {
          const result = await getSymbolHandler(args as unknown as GetSymbolInput);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error: error instanceof Error ? error.message : 'Unknown error occurred',
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      }

      if (name === 'get_doc') {
        try {
          const result = await getDocHandler(args as unknown as GetDocInput);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error: error instanceof Error ? error.message : 'Unknown error occurred',
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      }

      throw new Error(`Unknown tool: ${name}`);
    });

    const toolNames = ['search_docs', 'get_doc'];
    if (searchSymbolsHandler) {
      toolNames.push('search_symbols');
    }
    if (getSymbolHandler) {
      toolNames.push('get_symbol');
    }
    console.log(`[MCP Server] Registered tools: ${toolNames.join(', ')}`);
  }

  private shutdown(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('[MCP Server] Shutting down...');
    this.isRunning = false;

    this.server.close();

    console.log('[MCP Server] Server stopped');
    process.exit(0);
  }

  isServerRunning(): boolean {
    return this.isRunning;
  }
}
