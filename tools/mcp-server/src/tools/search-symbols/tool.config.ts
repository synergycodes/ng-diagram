export const SEARCH_SYMBOLS_TOOL = {
  name: 'search_symbols',
  description:
    'Search the ng-diagram public API for classes, functions, interfaces, types, constants, and enums. Call this whenever you need to reference a symbol by name — it returns the exact current signature and import path, which is more reliable than any example from training data. Use specific symbol names or partial names for best results.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Search query to find API symbols. Use symbol names or partial names (e.g., "Diagram", "provideNg", "Edge").',
      },
      kind: {
        type: 'string',
        description: 'Filter results by symbol kind',
        enum: ['class', 'function', 'interface', 'type', 'const', 'enum'],
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10)',
        default: 10,
      },
    },
    required: ['query'],
  },
} as const;
