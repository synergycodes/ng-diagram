/**
 * Search engine for documentation content
 */

import type { DocumentMetadata, SearchMatch, SearchQuery, SearchResult } from './types/index.js';

/**
 * Scoring weights for different match locations
 */
const SCORE_WEIGHTS = {
  title: 100,
  description: 50,
  path: 25,
  content: 10,
} as const;

/**
 * Default context length for excerpts (characters on each side of match)
 */
const EXCERPT_CONTEXT_LENGTH = 150;

/**
 * Search engine that performs case-insensitive text search across documentation
 */
export class SearchEngine {
  private documents: DocumentMetadata[];

  /**
   * Creates a new SearchEngine instance
   * @param documents - Array of indexed documents to search
   */
  constructor(documents: DocumentMetadata[]) {
    this.documents = documents;
  }

  /**
   * Searches documents for the given query
   * @param query - Search query parameters
   * @returns Array of search results, ranked by relevance
   */
  search(query: SearchQuery): SearchResult[] {
    const { query: searchQuery, limit = 10 } = query;

    // Find all matching documents
    const matches: SearchMatch[] = [];
    for (const doc of this.documents) {
      const match = this.matchDocument(doc, searchQuery);
      if (match) {
        matches.push(match);
      }
    }

    // Rank results by relevance
    const rankedMatches = this.rankResults(matches);

    // Apply limit and convert to search results
    return rankedMatches.slice(0, limit).map((match) => this.toSearchResult(match, searchQuery));
  }

  /**
   * Checks if a document matches the query and returns match information
   * @param doc - Document to check
   * @param query - Search query string
   * @returns SearchMatch if document matches, null otherwise
   */
  private matchDocument(doc: DocumentMetadata, query: string): SearchMatch | null {
    const lowerQuery = query.toLowerCase();

    // Check title match (highest priority)
    if (doc.title.toLowerCase().includes(lowerQuery)) {
      return {
        document: doc,
        score: SCORE_WEIGHTS.title,
        matchLocation: 'title',
      };
    }

    // Check description match
    if (doc.description && doc.description.toLowerCase().includes(lowerQuery)) {
      return {
        document: doc,
        score: SCORE_WEIGHTS.description,
        matchLocation: 'description',
      };
    }

    // Check path match
    if (doc.path.toLowerCase().includes(lowerQuery)) {
      return {
        document: doc,
        score: SCORE_WEIGHTS.path,
        matchLocation: 'path',
      };
    }

    // Check content match (lowest priority)
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
   * Ranks search matches by relevance score
   * @param matches - Array of search matches
   * @returns Sorted array of matches (highest score first)
   */
  private rankResults(matches: SearchMatch[]): SearchMatch[] {
    return matches.sort((a, b) => {
      // Sort by score (descending)
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      // For ties, sort alphabetically by title
      return a.document.title.localeCompare(b.document.title);
    });
  }

  /**
   * Extracts a text excerpt showing the match context
   * @param content - Full document content
   * @param query - Search query string
   * @param contextLength - Number of characters to include on each side of match
   * @returns Excerpt string with match context
   */
  private extractExcerpt(content: string, query: string, contextLength: number): string {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerContent.indexOf(lowerQuery);

    // If no match in content, return empty string
    if (matchIndex === -1) {
      return '';
    }

    // Calculate excerpt boundaries
    const startIndex = Math.max(0, matchIndex - contextLength);
    const endIndex = Math.min(content.length, matchIndex + query.length + contextLength);

    // Extract the excerpt
    let excerpt = content.substring(startIndex, endIndex);

    // Trim to word boundaries to avoid cutting words
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

    // Add ellipsis if content is truncated
    const prefix = startIndex > 0 ? '...' : '';
    const suffix = endIndex < content.length ? '...' : '';

    return `${prefix}${excerpt.trim()}${suffix}`;
  }

  /**
   * Converts a SearchMatch to a SearchResult
   * @param match - Search match with document and score
   * @param query - Original search query
   * @returns SearchResult formatted for response
   */
  private toSearchResult(match: SearchMatch, query: string): SearchResult {
    const { document, matchLocation } = match;

    // Extract excerpt if match was in content
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
