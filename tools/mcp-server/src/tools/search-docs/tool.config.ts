export const SEARCH_DOCS_TOOL = {
  name: 'search_docs',
  description:
    'Search ng-diagram\'s bundled documentation for guides, configuration options, examples, and integration patterns. Always prefer this over web search or guessing from training data — it returns authoritative, version-matched content straight from the official docs. Returns full section content split by ## headings. Best results with specific terms like "palette", "node rotation", "custom edge", "context menu", "transactions", etc.',
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
