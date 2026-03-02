import type { GetDocInput } from './tool.types.js';

export function validateInput(input: GetDocInput): void {
  if (!input.path) {
    throw new Error('Path parameter is required');
  }

  if (input.path.trim().length === 0) {
    throw new Error('Path parameter cannot be empty');
  }

  // Reject path traversal attempts
  const normalized = input.path.replace(/\\/g, '/');
  if (normalized.includes('..') || normalized.startsWith('/')) {
    throw new Error('Path must be a relative path within the docs directory');
  }
}
