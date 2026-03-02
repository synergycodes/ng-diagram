import type { SearchSymbolsInput } from './tool.types.js';

const VALID_KINDS = ['class', 'function', 'interface', 'type', 'const', 'enum'];

export function validateInput(input: SearchSymbolsInput): void {
  if (!input.query) {
    throw new Error('Query parameter is required');
  }

  if (input.query.trim().length === 0) {
    throw new Error('Query parameter cannot be empty');
  }

  if (input.query.length > 1000) {
    throw new Error('Query parameter is too long (max 1000 characters)');
  }

  if (input.kind !== undefined && !VALID_KINDS.includes(input.kind)) {
    throw new Error(`Invalid kind parameter. Must be one of: ${VALID_KINDS.join(', ')}`);
  }

  if (
    input.limit !== undefined &&
    (typeof input.limit !== 'number' || !Number.isFinite(input.limit) || input.limit < 0)
  ) {
    throw new Error('Limit parameter must be a non-negative number');
  }

  if (input.limit !== undefined && input.limit > 100) {
    throw new Error('Limit parameter must not exceed 100');
  }
}
