import type { ApiReportIndexer } from '../../services/api-indexer.js';
import type { GetSymbolInput, GetSymbolOutput } from './tool.types.js';
import { validateInput } from './tool.validator.js';

export function createGetSymbolHandler(apiIndexer: ApiReportIndexer) {
  return async (input: GetSymbolInput): Promise<GetSymbolOutput> => {
    try {
      validateInput(input);

      const symbol = apiIndexer.getSymbol(input.name);

      if (!symbol) {
        throw new Error(`Symbol not found: ${input.name}`);
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
