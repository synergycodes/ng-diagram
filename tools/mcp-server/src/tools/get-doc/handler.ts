import type { DocumentationIndexer } from '../../services/indexer.js';
import type { GetDocInput, GetDocOutput } from './tool.types.js';
import { validateInput } from './tool.validator.js';

export function createGetDocHandler(indexer: DocumentationIndexer) {
  return async (input: GetDocInput): Promise<GetDocOutput> => {
    try {
      validateInput(input);

      const page = indexer.getPage(input.path);

      if (!page) {
        throw new Error(`Document not found: ${input.path}`);
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
