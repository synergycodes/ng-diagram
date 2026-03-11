import type { SearchResult } from '../../types/index.js';

export type { SearchDocsInput } from './tool.validator.js';

/**
 * Output schema for the search_docs tool
 */
export interface SearchDocsOutput {
  /** Array of search results */
  results: SearchResult[];
}
