import type { GetDocInput } from './tool.types.js';

export function validateInput(input: GetDocInput): void {
  if (!input.path) {
    throw new Error('Path parameter is required');
  }

  if (input.path.trim().length === 0) {
    throw new Error('Path parameter cannot be empty');
  }
}
