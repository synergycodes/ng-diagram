/**
 * MCP Server implementation for ng-diagram documentation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type ListToolsRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { DocumentationIndexer } from './indexer.js';
import { SearchEngine } from './search.js';
import { SEARCH_DOCS_TOOL, createSearchDocsHandler, type SearchDocsInput } from './tools/search-docs/index.js';
import type { MCPServerConfig } from './types/index.js';

/**
 * MCP Server for ng-diagram documentation search
 */
export class NgDiagramMCPServer {
  private config: MCPServerConfig;
  private server: Server;
  private indexer: DocumentationIndexer;
  private searchEngine: SearchEngine | null = null;
  private isRunning = false;

  /**
   * Creates a new NgDiagramMCPServer instance
   * @param config - Server configuration
   */
  constructor(config: MCPServerConfig) {
    this.config = config;

    // Initialize MCP server
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

    // Initialize indexer
    this.indexer = new DocumentationIndexer({
      docsPath: config.docsPath,
      extensions: ['.md', '.mdx'],
    });

    // Set up error handlers
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
      const documents = await this.indexer.buildIndex();
      console.log(`[MCP Server] Indexed ${documents.length} documents`);

      // Initialize search engine
      this.searchEngine = new SearchEngine(documents);

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

  /**
   * Registers MCP tools with the server
   */
  private registerTools(): void {
    if (!this.searchEngine) {
      throw new Error('Search engine not initialized. Call start() first.');
    }

    // Create search tool handler
    const searchHandler = createSearchDocsHandler(this.searchEngine);

    // Register list tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => {
      return {
        tools: [SEARCH_DOCS_TOOL],
      };
    });

    // Register call tool handler
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

      throw new Error(`Unknown tool: ${name}`);
    });

    console.log('[MCP Server] Registered tool: search_docs');
  }

  /**
   * Shuts down the MCP server gracefully
   */
  private shutdown(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('[MCP Server] Shutting down...');
    this.isRunning = false;

    // Close server
    this.server.close();

    console.log('[MCP Server] Server stopped');
    process.exit(0);
  }

  /**
   * Gets the current running status of the server
   * @returns True if server is running, false otherwise
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }
}
