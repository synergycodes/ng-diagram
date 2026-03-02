import type { SearchDocsInput } from './tool.types.js';

export function validateInput(input: SearchDocsInput): void {
  if (!input.query) {
    throw new Error('Query parameter is required');
  }

  if (input.query.trim().length === 0) {
    throw new Error('Query parameter cannot be empty');
  }

  if (
    input.limit !== undefined &&
    (typeof input.limit !== 'number' || !Number.isFinite(input.limit) || input.limit < 0)
  ) {
    throw new Error('Limit parameter must be a non-negative number');
  }
}
