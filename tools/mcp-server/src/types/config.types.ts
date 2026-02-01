/**
 * Configuration-related type definitions
 */

/**
 * Configuration for the documentation indexer
 */
export interface IndexerConfig {
  /** Path to the documentation directory */
  docsPath: string;
  /** File extensions to index (e.g., ['.md', '.mdx']) */
  extensions: string[];
}

/**
 * Configuration for the MCP server
 */
export interface MCPServerConfig {
  /** Server name */
  name: string;
  /** Server version */
  version: string;
  /** Path to the documentation directory */
  docsPath: string;
}
