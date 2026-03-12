import type { SymbolSearchEngine } from '../../services/symbol-search.js';
import type { SearchSymbolsOutput } from './tool.types.js';
import { SearchSymbolsInputSchema } from './tool.validator.js';

export function createSearchSymbolsHandler(symbolSearch: SymbolSearchEngine) {
  return async (input: unknown): Promise<SearchSymbolsOutput> => {
    try {
      const parsed = SearchSymbolsInputSchema.parse(input);

      return {
        results: symbolSearch.search(parsed.query, parsed.kind, parsed.limit ?? 10),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Symbol search failed: ${error.message}`);
      }
      throw new Error('Symbol search failed: Unknown error occurred');
    }
  };
}
