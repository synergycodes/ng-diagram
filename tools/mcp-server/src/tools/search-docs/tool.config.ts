export const SEARCH_DOCS_TOOL = {
  name: 'search_docs',
  description:
    'Search through ng-diagram documentation. Supports exact phrases, multi-word queries, and individual keywords. Best results with specific terms like "palette", "node rotation", "custom edge", "quick start", etc.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Search query to find relevant documentation. Use specific keywords for best results (e.g., "palette", "rotation", "edges"). Multi-word queries will match documents containing most of the words.',
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
