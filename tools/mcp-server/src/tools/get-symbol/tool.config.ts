export const GET_SYMBOL_TOOL = {
  name: 'get_symbol',
  description:
    'Retrieve full API details for a specific ng-diagram symbol by exact name. Call this before writing any code that uses an ng-diagram class, function, or type — it returns the definitive signature, jsDoc, and a ready-to-use import statement so you never have to guess. Use symbol names returned by search_symbols.',
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
