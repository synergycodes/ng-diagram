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
  /** Base URL for the documentation site (e.g., 'https://www.ngdiagram.dev') */
  baseUrl: string;
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
  /** Base URL for the documentation site */
  baseUrl: string;
}
