import type { SearchEngine } from '../../services/search.js';
import type { SearchQuery } from '../../types/index.js';
import type { SearchDocsInput, SearchDocsOutput } from './tool.types.js';
import { validateInput } from './tool.validator.js';

export function createSearchDocsHandler(searchEngine: SearchEngine) {
  return async (input: SearchDocsInput): Promise<SearchDocsOutput> => {
    try {
      validateInput(input);

      const searchQuery: SearchQuery = {
        query: input.query.trim(),
        limit: input.limit ?? 10,
      };

      return {
        results: searchEngine.search(searchQuery),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Search failed: ${error.message}`);
      }
      throw new Error('Search failed: Unknown error occurred');
    }
  };
}
