/**
 * Unit tests for search_docs tool handler
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { SearchEngine } from '../src/services/search.js';
import { createSearchDocsHandler, SEARCH_DOCS_TOOL } from '../src/tools/search-docs/index.js';
import type { SearchDocsInput } from '../src/tools/search-docs/tool.types.js';
import type { DocumentMetadata } from '../src/types/index.js';

describe('search_docs tool', () => {
  let testDocuments: DocumentMetadata[];
  let searchEngine: SearchEngine;
  let handler: ReturnType<typeof createSearchDocsHandler>;

  beforeEach(() => {
    // Create test documents
    testDocuments = [
      {
        path: 'guides/palette.md',
        title: 'Palette Guide',
        description: 'Learn how to use the palette component',
        content: 'The palette allows you to drag and drop nodes onto the canvas.',
        url: '/docs/guides/palette',
      },
      {
        path: 'intro/quick-start.md',
        title: 'Quick Start',
        description: 'Get started quickly with ng-diagram',
        content: 'Install the package using npm install ng-diagram.',
        url: '/docs/intro/quick-start',
      },
      {
        path: 'api/components.md',
        title: 'Components API',
        description: 'API reference for all components',
        content: 'This document describes the available Angular components in the library.',
        url: '/docs/api/components',
      },
    ];

    searchEngine = new SearchEngine(testDocuments);
    handler = createSearchDocsHandler(searchEngine);
  });

  describe('tool schema definition', () => {
    it('should have correct tool name', () => {
      expect(SEARCH_DOCS_TOOL.name).toBe('search_docs');
    });

    it('should have a description', () => {
      expect(SEARCH_DOCS_TOOL.description).toBeDefined();
      expect(SEARCH_DOCS_TOOL.description.length).toBeGreaterThan(0);
    });

    it('should define input schema with query parameter', () => {
      expect(SEARCH_DOCS_TOOL.inputSchema.properties.query).toBeDefined();
      expect(SEARCH_DOCS_TOOL.inputSchema.properties.query.type).toBe('string');
    });

    it('should define input schema with limit parameter', () => {
      expect(SEARCH_DOCS_TOOL.inputSchema.properties.limit).toBeDefined();
      expect(SEARCH_DOCS_TOOL.inputSchema.properties.limit.type).toBe('number');
      expect(SEARCH_DOCS_TOOL.inputSchema.properties.limit.default).toBe(10);
    });

    it('should mark query as required', () => {
      expect(SEARCH_DOCS_TOOL.inputSchema.required).toContain('query');
    });

    it('should not mark limit as required', () => {
      expect(SEARCH_DOCS_TOOL.inputSchema.required).not.toContain('limit');
    });
  });

  describe('input validation - empty query rejection', () => {
    it('should reject empty string query', async () => {
      const input: SearchDocsInput = { query: '' };

      await expect(handler(input)).rejects.toThrow('Query parameter is required');
    });

    it('should reject whitespace-only query', async () => {
      const input: SearchDocsInput = { query: '   ' };

      await expect(handler(input)).rejects.toThrow('Query parameter cannot be empty');
    });

    it('should reject query with tabs and spaces', async () => {
      const input: SearchDocsInput = { query: '\t  \t  ' };

      await expect(handler(input)).rejects.toThrow('Query parameter cannot be empty');
    });

    it('should reject query with newlines', async () => {
      const input: SearchDocsInput = { query: '\n\n' };

      await expect(handler(input)).rejects.toThrow('Query parameter cannot be empty');
    });
  });

  describe('successful search with results', () => {
    it('should return results for valid query', async () => {
      const input: SearchDocsInput = { query: 'palette' };

      const output = await handler(input);

      expect(output.results).toBeDefined();
      expect(output.results).toHaveLength(1);
      expect(output.results[0].title).toBe('Palette Guide');
    });

    it('should return multiple results when multiple matches exist', async () => {
      const input: SearchDocsInput = { query: 'the' };

      const output = await handler(input);

      expect(output.results).toBeDefined();
      expect(output.results.length).toBeGreaterThan(1);
    });

    it('should return results with all required fields', async () => {
      const input: SearchDocsInput = { query: 'Quick Start' };

      const output = await handler(input);

      expect(output.results).toHaveLength(1);
      const result = output.results[0];
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('excerpt');
      expect(result).toHaveProperty('url');
    });

    it('should trim whitespace from query', async () => {
      const input: SearchDocsInput = { query: '  palette  ' };

      const output = await handler(input);

      expect(output.results).toHaveLength(1);
      expect(output.results[0].title).toBe('Palette Guide');
    });

    it('should handle case-insensitive search', async () => {
      const input: SearchDocsInput = { query: 'PALETTE' };

      const output = await handler(input);

      expect(output.results).toHaveLength(1);
      expect(output.results[0].title).toBe('Palette Guide');
    });
  });

  describe('successful search with no results', () => {
    it('should return empty results array when no matches found', async () => {
      const input: SearchDocsInput = { query: 'nonexistent-term-xyz' };

      const output = await handler(input);

      expect(output.results).toBeDefined();
      expect(output.results).toEqual([]);
    });

    it('should return empty results for query not in any document', async () => {
      const input: SearchDocsInput = { query: 'quantum-physics' };

      const output = await handler(input);

      expect(output.results).toEqual([]);
    });

    it('should not throw error when no results found', async () => {
      const input: SearchDocsInput = { query: 'nonexistent' };

      await expect(handler(input)).resolves.toBeDefined();
    });
  });

  describe('limit parameter handling', () => {
    it('should use default limit of 10 when not provided', async () => {
      const input: SearchDocsInput = { query: 'the' };

      const output = await handler(input);

      // Should not exceed default limit
      expect(output.results.length).toBeLessThanOrEqual(10);
    });

    it('should respect custom limit when provided', async () => {
      const input: SearchDocsInput = { query: 'the', limit: 1 };

      const output = await handler(input);

      expect(output.results).toHaveLength(1);
    });

    it('should handle limit of 0', async () => {
      const input: SearchDocsInput = { query: 'palette', limit: 0 };

      const output = await handler(input);

      expect(output.results).toHaveLength(0);
    });

    it('should handle large limit values', async () => {
      const input: SearchDocsInput = { query: 'the', limit: 100 };

      const output = await handler(input);

      // Should return all matches (less than 100)
      expect(output.results.length).toBeLessThanOrEqual(100);
      expect(output.results.length).toBeGreaterThan(0);
    });

    it('should limit results to specified number', async () => {
      const input: SearchDocsInput = { query: 'the', limit: 2 };

      const output = await handler(input);

      expect(output.results).toHaveLength(2);
    });
  });

  describe('error handling for search failures', () => {
    it('should wrap errors with meaningful message', async () => {
      // Create a handler with a broken search engine
      const brokenEngine = {
        search: () => {
          throw new Error('Database connection failed');
        },
      } as unknown as SearchEngine;

      const brokenHandler = createSearchDocsHandler(brokenEngine);
      const input: SearchDocsInput = { query: 'test' };

      await expect(brokenHandler(input)).rejects.toThrow('Search failed: Database connection failed');
    });

    it('should handle unknown errors gracefully', async () => {
      // Create a handler that throws non-Error object
      const brokenEngine = {
        search: () => {
          throw 'String error';
        },
      } as unknown as SearchEngine;

      const brokenHandler = createSearchDocsHandler(brokenEngine);
      const input: SearchDocsInput = { query: 'test' };

      await expect(brokenHandler(input)).rejects.toThrow('Search failed: Unknown error occurred');
    });

    it('should handle validation errors', async () => {
      const input: SearchDocsInput = { query: '', limit: 5 };

      await expect(handler(input)).rejects.toThrow();
    });

    it('should handle invalid limit parameter', async () => {
      const input = { query: 'test', limit: -1 };

      await expect(handler(input as SearchDocsInput)).rejects.toThrow('Limit parameter must be a non-negative number');
    });

    it('should handle non-number limit parameter', async () => {
      const input = { query: 'test', limit: 'invalid' };

      await expect(handler(input as any)).rejects.toThrow('Limit parameter must be a non-negative number');
    });
  });

  describe('integration with SearchEngine', () => {
    it('should pass query to search engine correctly', async () => {
      const input: SearchDocsInput = { query: 'Components API' };

      const output = await handler(input);

      expect(output.results).toHaveLength(1);
      expect(output.results[0].title).toBe('Components API');
    });

    it('should pass limit to search engine correctly', async () => {
      const input: SearchDocsInput = { query: 'the', limit: 1 };

      const output = await handler(input);

      expect(output.results).toHaveLength(1);
    });

    it('should return search results in correct format', async () => {
      const input: SearchDocsInput = { query: 'palette' };

      const output = await handler(input);

      expect(output).toHaveProperty('results');
      expect(Array.isArray(output.results)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in query', async () => {
      const input: SearchDocsInput = { query: 'ng-diagram' };

      const output = await handler(input);

      expect(output.results).toHaveLength(1);
      expect(output.results[0].title).toBe('Quick Start');
    });

    it('should handle very long queries', async () => {
      const input: SearchDocsInput = { query: 'a'.repeat(1000) };

      const output = await handler(input);

      expect(output.results).toEqual([]);
    });

    it('should handle queries with multiple words', async () => {
      const input: SearchDocsInput = { query: 'drag and drop' };

      const output = await handler(input);

      expect(output.results).toHaveLength(1);
      expect(output.results[0].title).toBe('Palette Guide');
    });

    it('should handle empty search engine', async () => {
      const emptyEngine = new SearchEngine([]);
      const emptyHandler = createSearchDocsHandler(emptyEngine);
      const input: SearchDocsInput = { query: 'test' };

      const output = await emptyHandler(input);

      expect(output.results).toEqual([]);
    });
  });
});
