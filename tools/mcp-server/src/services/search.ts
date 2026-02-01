import type { DocumentMetadata, SearchMatch, SearchQuery, SearchResult } from '../types/index.js';

const SCORE_WEIGHTS = {
  title: 100,
  description: 50,
  path: 25,
  content: 10,
} as const;

const EXCERPT_CONTEXT_LENGTH = 150;

export class SearchEngine {
  private documents: DocumentMetadata[];

  constructor(documents: DocumentMetadata[]) {
    this.documents = documents;
  }

  search(query: SearchQuery): SearchResult[] {
    const { query: searchQuery, limit = 10 } = query;

    const matches: SearchMatch[] = [];
    for (const doc of this.documents) {
      const match = this.matchDocument(doc, searchQuery);
      if (match) {
        matches.push(match);
      }
    }

    const rankedMatches = this.rankResults(matches);

    return rankedMatches.slice(0, limit).map((match) => this.toSearchResult(match, searchQuery));
  }

  private matchDocument(doc: DocumentMetadata, query: string): SearchMatch | null {
    const lowerQuery = query.toLowerCase();

    if (doc.title.toLowerCase().includes(lowerQuery)) {
      return {
        document: doc,
        score: SCORE_WEIGHTS.title,
        matchLocation: 'title',
      };
    }

    if (doc.description && doc.description.toLowerCase().includes(lowerQuery)) {
      return {
        document: doc,
        score: SCORE_WEIGHTS.description,
        matchLocation: 'description',
      };
    }

    if (doc.path.toLowerCase().includes(lowerQuery)) {
      return {
        document: doc,
        score: SCORE_WEIGHTS.path,
        matchLocation: 'path',
      };
    }

    if (doc.content.toLowerCase().includes(lowerQuery)) {
      return {
        document: doc,
        score: SCORE_WEIGHTS.content,
        matchLocation: 'content',
      };
    }

    return null;
  }

  private rankResults(matches: SearchMatch[]): SearchMatch[] {
    return matches.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return a.document.title.localeCompare(b.document.title);
    });
  }

  private extractExcerpt(content: string, query: string, contextLength: number): string {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerContent.indexOf(lowerQuery);

    if (matchIndex === -1) {
      return '';
    }

    const startIndex = Math.max(0, matchIndex - contextLength);
    const endIndex = Math.min(content.length, matchIndex + query.length + contextLength);

    let excerpt = content.substring(startIndex, endIndex);

    if (startIndex > 0) {
      const firstSpace = excerpt.indexOf(' ');
      if (firstSpace !== -1) {
        excerpt = excerpt.substring(firstSpace + 1);
      }
    }

    if (endIndex < content.length) {
      const lastSpace = excerpt.lastIndexOf(' ');
      if (lastSpace !== -1) {
        excerpt = excerpt.substring(0, lastSpace);
      }
    }

    const prefix = startIndex > 0 ? '...' : '';
    const suffix = endIndex < content.length ? '...' : '';

    return `${prefix}${excerpt.trim()}${suffix}`;
  }

  private toSearchResult(match: SearchMatch, query: string): SearchResult {
    const { document, matchLocation } = match;

    const excerpt =
      matchLocation === 'content' ? this.extractExcerpt(document.content, query, EXCERPT_CONTEXT_LENGTH) : '';

    return {
      path: document.path,
      title: document.title,
      description: document.description,
      excerpt,
      url: document.url,
    };
  }
}
