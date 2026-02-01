/**
 * Handler for search_docs tool
 */

import type { SearchEngine } from '../../services/search.js';
import type { SearchQuery } from '../../types/index.js';
import type { SearchDocsInput, SearchDocsOutput } from './tool.types.js';
import { validateInput } from './tool.validator.js';

/**
 * Creates a search tool handler function
 * @param searchEngine - SearchEngine instance to use for searches
 * @returns Tool handler function
 */
export function createSearchDocsHandler(searchEngine: SearchEngine) {
  /**
   * Handles search_docs tool invocations
   * @param input - Search parameters
   * @returns Search results
   */
  return async (input: SearchDocsInput): Promise<SearchDocsOutput> => {
    try {
      // Validate input
      validateInput(input);

      // Prepare search query
      const searchQuery: SearchQuery = {
        query: input.query.trim(),
        limit: input.limit ?? 10,
      };

      // Execute search
      const results = searchEngine.search(searchQuery);

      // Return formatted results
      return {
        results,
      };
    } catch (error) {
      // Handle errors and provide meaningful messages
      if (error instanceof Error) {
        throw new Error(`Search failed: ${error.message}`);
      }
      throw new Error('Search failed: Unknown error occurred');
    }
  };
}
