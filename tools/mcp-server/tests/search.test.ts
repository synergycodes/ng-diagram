/**
 * Unit tests for SearchEngine (MiniSearch-backed)
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { SearchEngine } from '../src/services/search.js';
import type { DocumentSection } from '../src/types/index.js';

describe('SearchEngine', () => {
  let testSections: DocumentSection[];
  let searchEngine: SearchEngine;

  beforeEach(() => {
    testSections = [
      {
        path: 'guides/palette.md',
        pageTitle: 'Palette Guide',
        sectionTitle: 'Palette Guide',
        description: 'Learn how to use the palette component',
        content: 'The palette allows you to drag and drop nodes onto the canvas.',
        url: '/docs/guides/palette',
      },
      {
        path: 'intro/quick-start.md',
        pageTitle: 'Quick Start',
        sectionTitle: 'Quick Start',
        description: 'Get started quickly with ng-diagram',
        content: 'Install the package using npm install ng-diagram.',
        url: '/docs/intro/quick-start',
      },
      {
        path: 'api/components.md',
        pageTitle: 'Components API',
        sectionTitle: 'Components API',
        description: 'API reference for all components',
        content: 'This document describes the available Angular components in the library.',
        url: '/docs/api/components',
      },
      {
        path: 'guides/nodes.md',
        pageTitle: 'Working with Nodes',
        sectionTitle: 'Working with Nodes',
        description: 'Understanding node behavior',
        content: 'Nodes are the fundamental building blocks of your diagram.',
        url: '/docs/guides/nodes',
      },
      {
        path: 'examples/custom-node.md',
        pageTitle: 'Custom Node Example',
        sectionTitle: 'Custom Node Example',
        content: 'This example shows how to create a custom node template.',
        url: '/docs/examples/custom-node',
      },
    ];

    searchEngine = new SearchEngine(testSections);
  });

  describe('basic matching', () => {
    it('should find section matching sectionTitle', () => {
      const results = searchEngine.search({ query: 'Palette Guide' });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].sectionTitle).toBe('Palette Guide');
    });

    it('should find section with partial sectionTitle match', () => {
      const results = searchEngine.search({ query: 'Quick' });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].sectionTitle).toBe('Quick Start');
    });

    it('should find multiple sections matching a keyword', () => {
      const results = searchEngine.search({ query: 'Node' });

      expect(results.length).toBeGreaterThanOrEqual(2);
      const titles = results.map((r) => r.sectionTitle);
      expect(titles).toContain('Working with Nodes');
      expect(titles).toContain('Custom Node Example');
    });
  });

  describe('matching across fields', () => {
    it('should find section matching description', () => {
      const results = searchEngine.search({ query: 'API reference' });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].sectionTitle).toBe('Components API');
      expect(results[0].description).toBe('API reference for all components');
    });

    it('should find section matching content', () => {
      const results = searchEngine.search({ query: 'npm install' });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].sectionTitle).toBe('Quick Start');
    });

    it('should find section matching content keywords', () => {
      const results = searchEngine.search({ query: 'Angular components' });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].sectionTitle).toBe('Components API');
    });

    it('should return full section content in results', () => {
      const results = searchEngine.search({ query: 'building blocks' });

      expect(results.length).toBeGreaterThanOrEqual(1);
      const match = results.find((r) => r.sectionTitle === 'Working with Nodes');
      expect(match).toBeDefined();
      expect(match!.content).toBe('Nodes are the fundamental building blocks of your diagram.');
    });
  });

  describe('case-insensitive matching', () => {
    it('should match query in lowercase', () => {
      const results = searchEngine.search({ query: 'palette guide' });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].sectionTitle).toBe('Palette Guide');
    });

    it('should match query in uppercase', () => {
      const results = searchEngine.search({ query: 'PALETTE GUIDE' });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].sectionTitle).toBe('Palette Guide');
    });

    it('should match query in mixed case', () => {
      const results = searchEngine.search({ query: 'PaLeTtE gUiDe' });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].sectionTitle).toBe('Palette Guide');
    });

    it('should match content case-insensitively', () => {
      const lowerResults = searchEngine.search({ query: 'angular' });
      const upperResults = searchEngine.search({ query: 'ANGULAR' });
      const mixedResults = searchEngine.search({ query: 'AnGuLaR' });

      expect(lowerResults.length).toBeGreaterThanOrEqual(1);
      expect(upperResults.length).toBeGreaterThanOrEqual(1);
      expect(mixedResults.length).toBeGreaterThanOrEqual(1);
      expect(lowerResults[0].sectionTitle).toBe(upperResults[0].sectionTitle);
      expect(lowerResults[0].sectionTitle).toBe(mixedResults[0].sectionTitle);
    });
  });

  describe('prefix matching', () => {
    it('should match prefix of a word', () => {
      const results = searchEngine.search({ query: 'palet' });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].sectionTitle).toBe('Palette Guide');
    });

    it('should match prefix in content', () => {
      const results = searchEngine.search({ query: 'fundament' });

      expect(results.length).toBeGreaterThanOrEqual(1);
      const match = results.find((r) => r.sectionTitle === 'Working with Nodes');
      expect(match).toBeDefined();
    });
  });

  describe('fuzzy matching', () => {
    it('should match with minor typos', () => {
      const results = searchEngine.search({ query: 'palete' });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].sectionTitle).toBe('Palette Guide');
    });
  });

  describe('limit parameter enforcement', () => {
    it('should return all results when limit is not specified', () => {
      const results = searchEngine.search({ query: 'the' });

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

      expect(results.length).toBeLessThanOrEqual(10);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].sectionTitle).toBe('Palette Guide');
    });

    it('should handle limit of 0', () => {
      const results = searchEngine.search({ query: 'node', limit: 0 });

      expect(results).toHaveLength(0);
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

  describe('ranking by field boost', () => {
    it('should rank sectionTitle matches higher than content matches', () => {
      const sections: DocumentSection[] = [
        {
          path: 'doc1.md',
          pageTitle: 'Doc One',
          sectionTitle: 'Other Section',
          description: 'Some description',
          content: 'Content mentions palette functionality',
          url: '/docs/doc1',
        },
        {
          path: 'doc2.md',
          pageTitle: 'Doc Two',
          sectionTitle: 'Palette Guide',
          description: 'A guide to something',
          content: 'More content',
          url: '/docs/doc2',
        },
      ];
      const engine = new SearchEngine(sections);

      const results = engine.search({ query: 'palette' });

      expect(results).toHaveLength(2);
      expect(results[0].sectionTitle).toBe('Palette Guide');
    });

    it('should rank description matches higher than content matches', () => {
      const sections: DocumentSection[] = [
        {
          path: 'doc1.md',
          pageTitle: 'Document One',
          sectionTitle: 'Section One',
          description: 'Some description',
          content: 'This content mentions palette functionality',
          url: '/docs/doc1',
        },
        {
          path: 'doc2.md',
          pageTitle: 'Document Two',
          sectionTitle: 'Section Two',
          description: 'Guide about palette usage',
          content: 'Other content',
          url: '/docs/doc2',
        },
      ];
      const engine = new SearchEngine(sections);

      const results = engine.search({ query: 'palette' });

      expect(results).toHaveLength(2);
      expect(results[0].sectionTitle).toBe('Section Two');
      expect(results[1].sectionTitle).toBe('Section One');
    });

    it('should rank sectionTitle > pageTitle > description > content', () => {
      const sections: DocumentSection[] = [
        {
          path: 'doc1.md',
          pageTitle: 'Something',
          sectionTitle: 'Section A',
          description: 'Description',
          content: 'Content with diagram keyword',
          url: '/docs/doc1',
        },
        {
          path: 'doc2.md',
          pageTitle: 'Other',
          sectionTitle: 'Section B',
          description: 'Description about diagram',
          content: 'Content',
          url: '/docs/doc2',
        },
        {
          path: 'doc3.md',
          pageTitle: 'Page Three',
          sectionTitle: 'Diagram Guide',
          description: 'Description',
          content: 'Content',
          url: '/docs/doc3',
        },
        {
          path: 'doc4.md',
          pageTitle: 'Diagram Overview',
          sectionTitle: 'Section D',
          description: 'Description',
          content: 'Content',
          url: '/docs/doc4',
        },
      ];
      const engine = new SearchEngine(sections);

      const results = engine.search({ query: 'diagram' });

      expect(results).toHaveLength(4);
      expect(results[0].sectionTitle).toBe('Diagram Guide');
      expect(results[1].sectionTitle).toBe('Section D');
      expect(results[2].sectionTitle).toBe('Section B');
      expect(results[3].sectionTitle).toBe('Section A');
    });
  });

  describe('search result format', () => {
    it('should include all required fields in search result', () => {
      const results = searchEngine.search({ query: 'Palette' });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0]).toHaveProperty('pageTitle');
      expect(results[0]).toHaveProperty('sectionTitle');
      expect(results[0]).toHaveProperty('content');
      expect(results[0]).toHaveProperty('path');
      expect(results[0]).toHaveProperty('url');
    });

    it('should handle sections without description', () => {
      const results = searchEngine.search({ query: 'Custom Node Example' });

      expect(results.length).toBeGreaterThanOrEqual(1);
      const exactMatch = results.find((r) => r.sectionTitle === 'Custom Node Example');
      expect(exactMatch).toBeDefined();
      expect(exactMatch!.description).toBeUndefined();
    });

    it('should preserve original section data', () => {
      const results = searchEngine.search({ query: 'Quick Start' });

      expect(results[0].sectionTitle).toBe('Quick Start');
      expect(results[0].pageTitle).toBe('Quick Start');
      expect(results[0].url).toBe('/docs/intro/quick-start');
    });

    it('should return full section content', () => {
      const results = searchEngine.search({ query: 'Palette Guide' });

      expect(results[0].content).toBe('The palette allows you to drag and drop nodes onto the canvas.');
    });
  });

  describe('edge cases', () => {
    it('should handle empty section array', () => {
      const engine = new SearchEngine([]);
      const results = engine.search({ query: 'test' });

      expect(results).toEqual([]);
    });

    it('should handle query with only whitespace', () => {
      const results = searchEngine.search({ query: '   ' });

      expect(results).toEqual([]);
    });

    it('should handle very long queries', () => {
      const longQuery = 'a'.repeat(1000);
      const results = searchEngine.search({ query: longQuery });

      expect(results).toEqual([]);
    });

    it('should handle sections with empty content', () => {
      const sections: DocumentSection[] = [
        {
          path: 'empty.md',
          pageTitle: 'Empty Document',
          sectionTitle: 'Empty Document',
          content: '',
          url: '/docs/empty',
        },
      ];
      const engine = new SearchEngine(sections);

      const results = engine.search({ query: 'Empty' });

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('');
    });
  });
});
