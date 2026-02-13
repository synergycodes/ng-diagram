export const GET_SYMBOL_TOOL = {
  name: 'get_symbol',
  description:
    'Retrieve full API details for a specific ng-diagram symbol by exact name. Returns kind, full signature, jsDoc (if available), and a ready-to-use import statement. Use symbol names returned by search_symbols.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Exact symbol name (case-sensitive). Use names from search_symbols results.',
      },
    },
    required: ['name'],
  },
} as const;
