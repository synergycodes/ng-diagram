import MiniSearch from 'minisearch';
import type { ApiSymbol, SearchSymbolResult } from '../types/index.js';

/**
 * Full-text search engine for API symbols, backed by MiniSearch.
 *
 * Indexes the symbol `name` and `signature` fields with prefix and fuzzy
 * matching (edit distance 0.2). Name matches are boosted 10x over signature
 * matches so that exact or partial name queries rank highest.
 *
 * Results can optionally be filtered by symbol kind (class, function, etc.)
 * after the search. The index is immutable after construction.
 */
export class SymbolSearchEngine {
  private index: MiniSearch;

  /**
   * Build a MiniSearch index from the given API symbols.
   * Each symbol is assigned a numeric id based on its array position.
   * @param symbols Array of API symbols to index
   */
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

  /**
   * Search the index for symbols matching the query, with optional kind filtering.
   * Whitespace-only queries return an empty array without hitting MiniSearch.
   * @param query Search string (matched against name and signature)
   * @param kind Optional symbol kind filter (e.g. `"class"`, `"function"`) — applied post-search
   * @param limit Maximum number of results to return (default 10)
   * @returns Matching symbols ranked by relevance, truncated to the limit
   */
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
