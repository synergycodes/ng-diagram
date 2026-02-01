/**
 * Input validation for search_docs tool
 */

import type { SearchDocsInput } from './tool.types.js';

/**
 * Validates search input parameters
 * @param input - Input parameters to validate
 * @throws Error if validation fails
 */
export function validateInput(input: SearchDocsInput): void {
  // Check if query is provided
  if (!input.query) {
    throw new Error('Query parameter is required');
  }

  // Check if query is not empty or whitespace-only
  if (typeof input.query !== 'string' || input.query.trim().length === 0) {
    throw new Error('Query parameter cannot be empty');
  }

  // Validate limit if provided
  if (input.limit !== undefined) {
    if (typeof input.limit !== 'number' || input.limit < 0) {
      throw new Error('Limit parameter must be a non-negative number');
    }
  }
}
