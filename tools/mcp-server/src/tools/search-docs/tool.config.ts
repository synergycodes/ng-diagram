export const SEARCH_DOCS_TOOL = {
  name: 'search_docs',
  description: 'Search through ng-diagram documentation',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query to find relevant documentation',
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
