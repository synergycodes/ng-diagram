import type { DocumentationIndexer } from '../../services/indexer.js';
import type { GetDocOutput } from './tool.types.js';
import { GetDocInputSchema } from './tool.validator.js';

export function createGetDocHandler(indexer: DocumentationIndexer) {
  return async (input: unknown): Promise<GetDocOutput> => {
    try {
      const parsed = GetDocInputSchema.parse(input);

      const page = indexer.getPage(parsed.path);

      if (!page) {
        throw new Error(`Document not found: ${parsed.path}`);
      }

      return {
        title: page.title,
        body: page.body,
        url: page.url,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Get doc failed: ${error.message}`);
      }
      throw new Error('Get doc failed: Unknown error occurred');
    }
  };
}
