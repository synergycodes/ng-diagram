import type { SearchSymbolResult } from '../../types/index.js';

/**
 * Input schema for the search_symbols tool
 */
export interface SearchSymbolsInput {
  /** Search query string */
  query: string;
  /** Filter results by symbol kind */
  kind?: string;
  /** Maximum number of results to return (default: 10) */
  limit?: number;
}

/**
 * Output schema for the search_symbols tool
 */
export interface SearchSymbolsOutput {
  /** Array of symbol search results */
  results: SearchSymbolResult[];
}
