import type { ApiReportIndexer } from '../../services/api-indexer.js';
import type { GetSymbolOutput } from './tool.types.js';
import { GetSymbolInputSchema } from './tool.validator.js';

export function createGetSymbolHandler(apiIndexer: ApiReportIndexer) {
  return async (input: unknown): Promise<GetSymbolOutput> => {
    try {
      const parsed = GetSymbolInputSchema.parse(input);

      const symbol = apiIndexer.getSymbol(parsed.name);

      if (!symbol) {
        throw new Error(`Symbol not found: ${parsed.name}`);
      }

      const output: GetSymbolOutput = {
        name: symbol.name,
        kind: symbol.kind,
        signature: symbol.signature,
        importStatement: `import { ${symbol.name} } from '${symbol.importPath}';`,
      };

      if (symbol.jsDoc) {
        output.jsDoc = symbol.jsDoc;
      }

      return output;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Get symbol failed: ${error.message}`);
      }
      throw new Error('Get symbol failed: Unknown error occurred');
    }
  };
}
