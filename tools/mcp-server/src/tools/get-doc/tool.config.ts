export const GET_DOC_TOOL = {
  name: 'get_doc',
  description:
    'Retrieve the full content of a documentation page by its path. Returns the complete markdown body with frontmatter stripped. Use the path values returned by search_docs results.',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative path from docs root (e.g., "guides/palette.mdx"). Use paths from search_docs results.',
      },
    },
    required: ['path'],
  },
} as const;
