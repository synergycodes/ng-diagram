import type { SearchSymbolsInput } from './tool.types.js';

const VALID_KINDS = ['class', 'function', 'interface', 'type', 'const', 'enum'];

export function validateInput(input: SearchSymbolsInput): void {
  if (!input.query) {
    throw new Error('Query parameter is required');
  }

  if (input.query.trim().length === 0) {
    throw new Error('Query parameter cannot be empty');
  }

  if (input.kind !== undefined && !VALID_KINDS.includes(input.kind)) {
    throw new Error(`Invalid kind parameter. Must be one of: ${VALID_KINDS.join(', ')}`);
  }

  if (typeof input.limit === 'string' || Number(input.limit) < 0) {
    throw new Error('Limit parameter must be a non-negative number');
  }
}
