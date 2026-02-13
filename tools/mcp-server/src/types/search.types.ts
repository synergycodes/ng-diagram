/**
 * Search-related type definitions
 */

/**
 * Search query parameters
 */
export interface SearchQuery {
  /** Search query string */
  query: string;
  /** Maximum number of results to return (default: 10) */
  limit?: number;
}

/**
 * Symbol search result returned to the user (compact, without jsDoc)
 */
export interface SearchSymbolResult {
  /** Symbol name */
  name: string;
  /** Symbol kind (class, function, interface, etc.) */
  kind: string;
  /** Symbol signature */
  signature: string;
  /** Import path for the symbol */
  importPath: string;
}

/**
 * Search result returned to the user
 */
export interface SearchResult {
  /** Title of the parent page */
  pageTitle: string;
  /** Title of the matched section */
  sectionTitle: string;
  /** Full markdown content of the matched section */
  content: string;
  /** Document description (if available, only on first section) */
  description?: string;
  /** Relative file path from docs root (use with get_doc) */
  path: string;
  /** Full documentation URL with anchor */
  url: string;
}
