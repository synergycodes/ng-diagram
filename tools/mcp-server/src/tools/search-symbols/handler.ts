import type { SymbolSearchEngine } from '../../services/symbol-search.js';
import type { SearchSymbolsInput, SearchSymbolsOutput } from './tool.types.js';
import { validateInput } from './tool.validator.js';

export function createSearchSymbolsHandler(symbolSearch: SymbolSearchEngine) {
  return async (input: SearchSymbolsInput): Promise<SearchSymbolsOutput> => {
    try {
      validateInput(input);

      return {
        results: symbolSearch.search(input.query.trim(), input.kind, input.limit ?? 10),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Symbol search failed: ${error.message}`);
      }
      throw new Error('Symbol search failed: Unknown error occurred');
    }
  };
}
