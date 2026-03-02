import type { GetSymbolInput } from './tool.types.js';

export function validateInput(input: GetSymbolInput): void {
  if (!input.name) {
    throw new Error('Name parameter is required');
  }

  if (input.name.trim().length === 0) {
    throw new Error('Name parameter cannot be empty');
  }

  if (input.name.length > 200) {
    throw new Error('Name parameter is too long (max 200 characters)');
  }
}
