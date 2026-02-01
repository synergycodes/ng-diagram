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
    const queryWords = lowerQuery.split(/\s+/).filter((word) => word.length > 0);

    // Try exact phrase match first (highest priority)
    const exactMatch = this.matchExactPhrase(doc, lowerQuery);
    if (exactMatch) {
      return exactMatch;
    }

    // Try multi-word match (match all words, but not necessarily as a phrase)
    if (queryWords.length > 1) {
      const multiWordMatch = this.matchMultipleWords(doc, queryWords);
      if (multiWordMatch) {
        return multiWordMatch;
      }
    }

    // Try single word match (any word matches)
    const singleWordMatch = this.matchAnyWord(doc, queryWords);
    if (singleWordMatch) {
      return singleWordMatch;
    }

    return null;
  }

  /**
   * Match exact phrase in document
   */
  private matchExactPhrase(doc: DocumentMetadata, lowerQuery: string): SearchMatch | null {
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

  /**
   * Match all query words (but not necessarily as a phrase)
   * Scores based on how many words match and where they match
   */
  private matchMultipleWords(doc: DocumentMetadata, queryWords: string[]): SearchMatch | null {
    const lowerTitle = doc.title.toLowerCase();
    const lowerDescription = doc.description?.toLowerCase() || '';
    const lowerPath = doc.path.toLowerCase();
    const lowerContent = doc.content.toLowerCase();

    let titleMatches = 0;
    let descriptionMatches = 0;
    let pathMatches = 0;
    let contentMatches = 0;

    for (const word of queryWords) {
      if (lowerTitle.includes(word)) titleMatches++;
      if (lowerDescription.includes(word)) descriptionMatches++;
      if (lowerPath.includes(word)) pathMatches++;
      if (lowerContent.includes(word)) contentMatches++;
    }

    const totalWords = queryWords.length;

    // Require at least 50% of words to match
    const minMatches = Math.ceil(totalWords * 0.5);

    if (titleMatches >= minMatches) {
      const matchRatio = titleMatches / totalWords;
      return {
        document: doc,
        score: SCORE_WEIGHTS.title * matchRatio * 0.8, // 80% of exact match score
        matchLocation: 'title',
      };
    }

    if (descriptionMatches >= minMatches) {
      const matchRatio = descriptionMatches / totalWords;
      return {
        document: doc,
        score: SCORE_WEIGHTS.description * matchRatio * 0.8,
        matchLocation: 'description',
      };
    }

    if (pathMatches >= minMatches) {
      const matchRatio = pathMatches / totalWords;
      return {
        document: doc,
        score: SCORE_WEIGHTS.path * matchRatio * 0.8,
        matchLocation: 'path',
      };
    }

    if (contentMatches >= minMatches) {
      const matchRatio = contentMatches / totalWords;
      return {
        document: doc,
        score: SCORE_WEIGHTS.content * matchRatio * 0.8,
        matchLocation: 'content',
      };
    }

    return null;
  }

  /**
   * Match any single word from the query
   * Lowest priority, but ensures we return something relevant
   */
  private matchAnyWord(doc: DocumentMetadata, queryWords: string[]): SearchMatch | null {
    const lowerTitle = doc.title.toLowerCase();
    const lowerDescription = doc.description?.toLowerCase() || '';
    const lowerPath = doc.path.toLowerCase();
    const lowerContent = doc.content.toLowerCase();

    for (const word of queryWords) {
      // Skip very short words (less than 3 characters) to avoid noise
      if (word.length < 3) continue;

      if (lowerTitle.includes(word)) {
        return {
          document: doc,
          score: SCORE_WEIGHTS.title * 0.5, // 50% of exact match score
          matchLocation: 'title',
        };
      }

      if (lowerDescription.includes(word)) {
        return {
          document: doc,
          score: SCORE_WEIGHTS.description * 0.5,
          matchLocation: 'description',
        };
      }

      if (lowerPath.includes(word)) {
        return {
          document: doc,
          score: SCORE_WEIGHTS.path * 0.5,
          matchLocation: 'path',
        };
      }

      if (lowerContent.includes(word)) {
        return {
          document: doc,
          score: SCORE_WEIGHTS.content * 0.5,
          matchLocation: 'content',
        };
      }
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

    // Try to find the exact query first
    let matchIndex = lowerContent.indexOf(lowerQuery);

    // If exact query not found, try to find the first word from the query
    if (matchIndex === -1) {
      const queryWords = lowerQuery.split(/\s+/).filter((word) => word.length > 2);
      for (const word of queryWords) {
        matchIndex = lowerContent.indexOf(word);
        if (matchIndex !== -1) break;
      }
    }

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
      title: document.title,
      description: document.description,
      excerpt,
      url: document.url,
    };
  }
}
