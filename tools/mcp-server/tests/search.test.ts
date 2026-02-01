/**
 * Unit tests for SearchEngine
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { SearchEngine } from '../src/services/search.js';
import type { DocumentMetadata } from '../src/types/index.js';

describe('SearchEngine', () => {
  let testDocuments: DocumentMetadata[];
  let searchEngine: SearchEngine;

  beforeEach(() => {
    // Create test documents with various content
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
      {
        path: 'guides/nodes.md',
        title: 'Working with Nodes',
        description: 'Understanding node behavior',
        content: 'Nodes are the fundamental building blocks of your diagram.',
        url: '/docs/guides/nodes',
      },
      {
        path: 'examples/custom-node.md',
        title: 'Custom Node Example',
        content: 'This example shows how to create a custom node template.',
        url: '/docs/examples/custom-node',
      },
    ];

    searchEngine = new SearchEngine(testDocuments);
  });

  describe('exact match in title', () => {
    it('should find document with exact title match', () => {
      const results = searchEngine.search({ query: 'Palette Guide' });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Palette Guide');
      expect(results[0].path).toBe('guides/palette.md');
    });

    it('should find document with partial title match', () => {
      const results = searchEngine.search({ query: 'Quick' });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Quick Start');
    });

    it('should find multiple documents with title matches', () => {
      const results = searchEngine.search({ query: 'Node' });

      expect(results.length).toBeGreaterThanOrEqual(2);
      const titles = results.map((r) => r.title);
      expect(titles).toContain('Working with Nodes');
      expect(titles).toContain('Custom Node Example');
    });
  });

  describe('exact match in description', () => {
    it('should find document with exact description match', () => {
      const results = searchEngine.search({ query: 'API reference' });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Components API');
      expect(results[0].description).toBe('API reference for all components');
    });

    it('should find document with partial description match', () => {
      const results = searchEngine.search({ query: 'palette component' });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Palette Guide');
    });
  });

  describe('exact match in content', () => {
    it('should find document with exact content match', () => {
      const results = searchEngine.search({ query: 'npm install' });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Quick Start');
    });

    it('should find document with partial content match', () => {
      const results = searchEngine.search({ query: 'Angular components' });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Components API');
    });

    it('should extract excerpt for content matches', () => {
      const results = searchEngine.search({ query: 'building blocks' });

      expect(results).toHaveLength(1);
      expect(results[0].excerpt).toContain('building blocks');
      expect(results[0].excerpt.length).toBeGreaterThan(0);
    });
  });

  describe('case-insensitive matching', () => {
    it('should match query in lowercase', () => {
      const results = searchEngine.search({ query: 'palette guide' });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Palette Guide');
    });

    it('should match query in uppercase', () => {
      const results = searchEngine.search({ query: 'PALETTE GUIDE' });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Palette Guide');
    });

    it('should match query in mixed case', () => {
      const results = searchEngine.search({ query: 'PaLeTtE gUiDe' });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Palette Guide');
    });

    it('should match content case-insensitively', () => {
      const lowerResults = searchEngine.search({ query: 'angular' });
      const upperResults = searchEngine.search({ query: 'ANGULAR' });
      const mixedResults = searchEngine.search({ query: 'AnGuLaR' });

      expect(lowerResults).toHaveLength(1);
      expect(upperResults).toHaveLength(1);
      expect(mixedResults).toHaveLength(1);
      expect(lowerResults[0].title).toBe(upperResults[0].title);
      expect(lowerResults[0].title).toBe(mixedResults[0].title);
    });
  });

  describe('limit parameter enforcement', () => {
    it('should return all results when limit is not specified', () => {
      const results = searchEngine.search({ query: 'the' });

      // "the" appears in multiple documents
      expect(results.length).toBeGreaterThan(1);
    });

    it('should limit results to specified number', () => {
      const results = searchEngine.search({ query: 'the', limit: 2 });

      expect(results).toHaveLength(2);
    });

    it('should respect limit of 1', () => {
      const results = searchEngine.search({ query: 'node', limit: 1 });

      expect(results).toHaveLength(1);
    });

    it('should return fewer results if matches are less than limit', () => {
      const results = searchEngine.search({ query: 'Palette Guide', limit: 10 });

      expect(results).toHaveLength(1);
    });

    it('should handle limit of 0', () => {
      const results = searchEngine.search({ query: 'node', limit: 0 });

      expect(results).toHaveLength(0);
    });
  });

  describe('excerpt extraction with match context', () => {
    it('should extract excerpt with surrounding context', () => {
      const results = searchEngine.search({ query: 'drag and drop' });

      expect(results).toHaveLength(1);
      expect(results[0].excerpt).toContain('drag and drop');
      expect(results[0].excerpt).toContain('palette');
      expect(results[0].excerpt).toContain('nodes');
    });

    it('should add ellipsis when content is truncated at start', () => {
      const longContent = 'A'.repeat(200) + ' drag and drop ' + 'B'.repeat(200);
      const docs = [
        {
          path: 'test.md',
          title: 'Test',
          content: longContent,
          url: '/docs/test',
        },
      ];
      const engine = new SearchEngine(docs);

      const results = engine.search({ query: 'drag and drop' });

      expect(results[0].excerpt).toMatch(/^\.\.\./);
    });

    it('should add ellipsis when content is truncated at end', () => {
      const longContent = 'A'.repeat(200) + ' drag and drop ' + 'B'.repeat(200);
      const docs = [
        {
          path: 'test.md',
          title: 'Test',
          content: longContent,
          url: '/docs/test',
        },
      ];
      const engine = new SearchEngine(docs);

      const results = engine.search({ query: 'drag and drop' });

      expect(results[0].excerpt).toMatch(/\.\.\.$/);
    });

    it('should not add ellipsis for short content', () => {
      const results = searchEngine.search({ query: 'npm install' });

      expect(results[0].excerpt).not.toMatch(/^\.\.\./);
      expect(results[0].excerpt).not.toMatch(/\.\.\.$/);
    });

    it('should return empty excerpt for title matches', () => {
      const results = searchEngine.search({ query: 'Palette Guide' });

      expect(results[0].excerpt).toBe('');
    });

    it('should return empty excerpt for description matches', () => {
      const results = searchEngine.search({ query: 'API reference' });

      expect(results[0].excerpt).toBe('');
    });
  });

  describe('empty results for non-matching queries', () => {
    it('should return empty array when no matches found', () => {
      const results = searchEngine.search({ query: 'nonexistent-term-xyz' });

      expect(results).toEqual([]);
    });

    it('should return empty array for query not in any field', () => {
      const results = searchEngine.search({ query: 'quantum-physics' });

      expect(results).toEqual([]);
    });

    it('should handle special characters in non-matching query', () => {
      const results = searchEngine.search({ query: '@#$%^&*()' });

      expect(results).toEqual([]);
    });
  });

  describe('ranking order (title > description > content)', () => {
    it('should rank title matches higher than description matches', () => {
      const docs = [
        {
          path: 'doc1.md',
          title: 'Other Document',
          description: 'This describes palette functionality',
          content: 'Some content here',
          url: '/docs/doc1',
        },
        {
          path: 'doc2.md',
          title: 'Palette Guide',
          description: 'A guide to something',
          content: 'More content',
          url: '/docs/doc2',
        },
      ];
      const engine = new SearchEngine(docs);

      const results = engine.search({ query: 'palette' });

      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Palette Guide'); // Title match first
      expect(results[1].title).toBe('Other Document'); // Description match second
    });

    it('should rank description matches higher than content matches', () => {
      const docs = [
        {
          path: 'doc1.md',
          title: 'Document One',
          description: 'Some description',
          content: 'This content mentions palette functionality',
          url: '/docs/doc1',
        },
        {
          path: 'doc2.md',
          title: 'Document Two',
          description: 'Guide about palette usage',
          content: 'Other content',
          url: '/docs/doc2',
        },
      ];
      const engine = new SearchEngine(docs);

      const results = engine.search({ query: 'palette' });

      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Document Two'); // Description match first
      expect(results[1].title).toBe('Document One'); // Content match second
    });

    it('should rank title > description > content in same query', () => {
      const docs = [
        {
          path: 'doc1.md',
          title: 'Something',
          description: 'Description',
          content: 'Content with diagram keyword',
          url: '/docs/doc1',
        },
        {
          path: 'doc2.md',
          title: 'Other',
          description: 'Description about diagram',
          content: 'Content',
          url: '/docs/doc2',
        },
        {
          path: 'doc3.md',
          title: 'Diagram Guide',
          description: 'Description',
          content: 'Content',
          url: '/docs/doc3',
        },
      ];
      const engine = new SearchEngine(docs);

      const results = engine.search({ query: 'diagram' });

      expect(results).toHaveLength(3);
      expect(results[0].title).toBe('Diagram Guide'); // Title match (score 100)
      expect(results[1].title).toBe('Other'); // Description match (score 50)
      expect(results[2].title).toBe('Something'); // Content match (score 10)
    });

    it('should sort alphabetically by title when scores are equal', () => {
      const docs = [
        {
          path: 'doc1.md',
          title: 'Zebra Guide',
          description: 'Guide about zebras',
          content: 'Content',
          url: '/docs/doc1',
        },
        {
          path: 'doc2.md',
          title: 'Apple Guide',
          description: 'Guide about apples',
          content: 'Content',
          url: '/docs/doc2',
        },
        {
          path: 'doc3.md',
          title: 'Mango Guide',
          description: 'Guide about mangos',
          content: 'Content',
          url: '/docs/doc3',
        },
      ];
      const engine = new SearchEngine(docs);

      const results = engine.search({ query: 'guide' });

      expect(results).toHaveLength(3);
      expect(results[0].title).toBe('Apple Guide');
      expect(results[1].title).toBe('Mango Guide');
      expect(results[2].title).toBe('Zebra Guide');
    });
  });

  describe('search result format', () => {
    it('should include all required fields in search result', () => {
      const results = searchEngine.search({ query: 'Palette' });

      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('path');
      expect(results[0]).toHaveProperty('title');
      expect(results[0]).toHaveProperty('description');
      expect(results[0]).toHaveProperty('excerpt');
      expect(results[0]).toHaveProperty('url');
    });

    it('should handle documents without description', () => {
      const results = searchEngine.search({ query: 'Custom Node Example' });

      expect(results).toHaveLength(1);
      expect(results[0].description).toBeUndefined();
    });

    it('should preserve original document data', () => {
      const results = searchEngine.search({ query: 'Quick Start' });

      expect(results[0].path).toBe('intro/quick-start.md');
      expect(results[0].title).toBe('Quick Start');
      expect(results[0].url).toBe('/docs/intro/quick-start');
    });
  });

  describe('edge cases', () => {
    it('should handle empty document array', () => {
      const engine = new SearchEngine([]);
      const results = engine.search({ query: 'test' });

      expect(results).toEqual([]);
    });

    it('should handle query with only whitespace', () => {
      const results = searchEngine.search({ query: '   ' });

      // Whitespace-only query should not match anything
      expect(results).toEqual([]);
    });

    it('should handle very long queries', () => {
      const longQuery = 'a'.repeat(1000);
      const results = searchEngine.search({ query: longQuery });

      expect(results).toEqual([]);
    });

    it('should handle documents with empty content', () => {
      const docs = [
        {
          path: 'empty.md',
          title: 'Empty Document',
          content: '',
          url: '/docs/empty',
        },
      ];
      const engine = new SearchEngine(docs);

      const results = engine.search({ query: 'Empty' });

      expect(results).toHaveLength(1);
      expect(results[0].excerpt).toBe('');
    });
  });
});
