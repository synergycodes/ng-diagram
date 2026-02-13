import MiniSearch from 'minisearch';
import type { DocumentSection, SearchQuery, SearchResult } from '../types/index.js';

export class SearchEngine {
  private index: MiniSearch;

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
