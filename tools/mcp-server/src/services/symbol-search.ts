import MiniSearch from 'minisearch';
import type { ApiSymbol, SearchSymbolResult } from '../types/index.js';

export class SymbolSearchEngine {
  private index: MiniSearch;

  constructor(symbols: ApiSymbol[]) {
    this.index = new MiniSearch({
      fields: ['name', 'signature'],
      storeFields: ['name', 'kind', 'signature', 'importPath'],
      searchOptions: {
        prefix: true,
        fuzzy: 0.2,
        boost: { name: 10, signature: 1 },
      },
    });

    this.index.addAll(symbols.map((symbol, i) => ({ id: i, ...symbol })));
  }

  search(query: string, kind?: string, limit = 10): SearchSymbolResult[] {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    let results = this.index.search(trimmed);

    if (kind) {
      results = results.filter((r) => r.kind === kind);
    }

    return results.slice(0, limit).map((result) => ({
      name: result.name as string,
      kind: result.kind as string,
      signature: result.signature as string,
      importPath: result.importPath as string,
    }));
  }
}
