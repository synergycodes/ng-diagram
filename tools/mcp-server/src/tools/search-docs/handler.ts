import type { SearchEngine } from '../../services/search.js';
import type { SearchQuery } from '../../types/index.js';
import type { SearchDocsOutput } from './tool.types.js';
import { SearchDocsInputSchema } from './tool.validator.js';

export function createSearchDocsHandler(searchEngine: SearchEngine) {
  return async (input: unknown): Promise<SearchDocsOutput> => {
    try {
      const parsed = SearchDocsInputSchema.parse(input);

      const searchQuery: SearchQuery = {
        query: parsed.query,
        limit: parsed.limit ?? 10,
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
