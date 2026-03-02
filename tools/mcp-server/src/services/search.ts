import MiniSearch from 'minisearch';
import type { DocumentSection, SearchQuery, SearchResult } from '../types/index.js';

/**
 * Full-text search engine for documentation sections, backed by MiniSearch.
 *
 * Supports prefix matching, fuzzy matching (edit distance 0.2), and field
 * boosting so that matches in section titles rank highest, followed by page
 * titles, descriptions, and body content.
 *
 * The index is immutable after construction — create a new instance to
 * re-index.
 */
export class SearchEngine {
  private index: MiniSearch;

  /**
   * Build a MiniSearch index from the given sections.
   * Each section is assigned a numeric id based on its array position.
   * @param sections Flat array of document sections to index
   */
  constructor(sections: DocumentSection[]) {
    this.index = new MiniSearch({
      fields: ['pageTitle', 'sectionTitle', 'content', 'description'],
      storeFields: ['pageTitle', 'sectionTitle', 'content', 'path', 'url', 'description'],
      searchOptions: {
        prefix: true,
        fuzzy: 0.2,
        boost: { sectionTitle: 10, pageTitle: 5, description: 2, content: 1 },
      },
    });

    this.index.addAll(sections.map((section, i) => ({ id: i, ...section })));
  }

  /**
   * Search the index and return matching sections ranked by relevance.
   * Whitespace-only queries return an empty array without hitting MiniSearch.
   * @param query Search query string and optional result limit (default 10)
   * @returns Matching sections, truncated to the requested limit
   */
  search(query: SearchQuery): SearchResult[] {
    const { query: searchQuery, limit = 10 } = query;

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return [];
    }

    const results = this.index.search(trimmed);

    return results.slice(0, limit).map((result) => ({
      pageTitle: result.pageTitle as string,
      sectionTitle: result.sectionTitle as string,
      content: result.content as string,
      description: result.description as string | undefined,
      path: result.path as string,
      url: result.url as string,
    }));
  }
}
