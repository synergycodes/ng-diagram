export const SEARCH_SYMBOLS_TOOL = {
  name: 'search_symbols',
  description:
    'Search through ng-diagram public API symbols (classes, functions, interfaces, types, constants, enums). Returns matching symbol names, signatures, and import paths. Use specific symbol names or partial names for best results.',
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
