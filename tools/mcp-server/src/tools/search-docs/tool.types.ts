import type { SearchResult } from '../../types/index.js';

/**
 * Input schema for the search_docs tool
 */
export interface SearchDocsInput {
  /** Search query string */
  query: string;
  /** Maximum number of results to return (default: 10) */
  limit?: number;
}

/**
 * Output schema for the search_docs tool
 */
export interface SearchDocsOutput {
  /** Array of search results */
  results: SearchResult[];
}
