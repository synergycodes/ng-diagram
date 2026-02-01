/**
 * Search-related type definitions
 */

import type { DocumentMetadata } from './document.types.js';

/**
 * Search query parameters
 */
export interface SearchQuery {
  /** Search query string */
  query: string;
  /** Maximum number of results to return (default: 10) */
  limit?: number;
}

/**
 * Search result returned to the user
 */
export interface SearchResult {
  /** Relative file path from docs root */
  path: string;
  /** Document title */
  title: string;
  /** Document description (if available) */
  description?: string;
  /** Text snippet showing match context */
  excerpt: string;
  /** Documentation URL path */
  url: string;
}

/**
 * Internal search match with scoring information
 */
export interface SearchMatch {
  /** The matched document */
  document: DocumentMetadata;
  /** Relevance score for ranking */
  score: number;
  /** Location where the match was found */
  matchLocation: 'title' | 'description' | 'content' | 'path';
}
