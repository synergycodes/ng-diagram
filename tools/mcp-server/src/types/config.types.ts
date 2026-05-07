/**
 * Configuration-related type definitions
 */

/** File names for pre-built indexes produced by build-indexes.js and loaded by the server. */
export const INDEX_FILE_NAMES = {
  docsSearch: 'docs-search-index.json',
  docsPages: 'docs-pages.json',
  symbolSearch: 'symbol-search-index.json',
  symbolMap: 'symbol-map.json',
} as const;

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
  /** Path to the examples directory for resolving CodeSnippet/CodeViewer tags */
  examplesPath?: string;
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
  /** Path to the API Extractor report file (.api.md) */
  apiReportPath?: string;
  /** Path to the examples directory for resolving CodeSnippet/CodeViewer tags */
  examplesPath?: string;
  /** Path to directory containing pre-built index files (skips runtime indexing when present) */
  indexDataPath?: string;
}
