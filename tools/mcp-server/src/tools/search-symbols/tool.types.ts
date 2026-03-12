import type { SearchSymbolResult } from '../../types/index.js';

export type { SearchSymbolsInput } from './tool.validator.js';

/**
 * Output schema for the search_symbols tool
 */
export interface SearchSymbolsOutput {
  /** Array of symbol search results */
  results: SearchSymbolResult[];
}
