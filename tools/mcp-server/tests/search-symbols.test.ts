/**
 * Unit tests for search_symbols tool handler
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { SymbolSearchEngine } from '../src/services/symbol-search.js';
import { createSearchSymbolsHandler, SEARCH_SYMBOLS_TOOL } from '../src/tools/search-symbols/index.js';
import type { SearchSymbolsInput } from '../src/tools/search-symbols/tool.types.js';
import type { ApiSymbol } from '../src/types/index.js';

describe('search_symbols tool', () => {
  let testSymbols: ApiSymbol[];
  let symbolSearch: SymbolSearchEngine;
  let handler: ReturnType<typeof createSearchSymbolsHandler>;

  beforeEach(() => {
    testSymbols = [
      {
        name: 'DiagramComponent',
        kind: 'class',
        signature: 'export class DiagramComponent',
        importPath: 'ng-diagram',
        jsDoc: 'Main diagram component',
      },
      {
        name: 'provideNgDiagram',
        kind: 'function',
        signature: 'export function provideNgDiagram(config?: DiagramConfig): Provider',
        importPath: 'ng-diagram',
      },
      {
        name: 'DiagramConfig',
        kind: 'interface',
        signature: 'export interface DiagramConfig',
        importPath: 'ng-diagram',
      },
      {
        name: 'EdgeType',
        kind: 'type',
        signature: 'export type EdgeType = "straight" | "bezier"',
        importPath: 'ng-diagram',
      },
      {
        name: 'DEFAULT_CONFIG',
        kind: 'const',
        signature: 'export const DEFAULT_CONFIG: DiagramConfig',
        importPath: 'ng-diagram',
      },
      {
        name: 'NodeShape',
        kind: 'enum',
        signature: 'export enum NodeShape',
        importPath: 'ng-diagram',
      },
    ];

    symbolSearch = new SymbolSearchEngine(testSymbols);
    handler = createSearchSymbolsHandler(symbolSearch);
  });

  describe('tool schema definition', () => {
    it('should have correct tool name', () => {
      expect(SEARCH_SYMBOLS_TOOL.name).toBe('search_symbols');
    });

    it('should have a description', () => {
      expect(SEARCH_SYMBOLS_TOOL.description).toBeDefined();
      expect(SEARCH_SYMBOLS_TOOL.description.length).toBeGreaterThan(0);
    });

    it('should define input schema with query parameter', () => {
      expect(SEARCH_SYMBOLS_TOOL.inputSchema.properties.query).toBeDefined();
      expect(SEARCH_SYMBOLS_TOOL.inputSchema.properties.query.type).toBe('string');
    });

    it('should define input schema with kind parameter', () => {
      expect(SEARCH_SYMBOLS_TOOL.inputSchema.properties.kind).toBeDefined();
      expect(SEARCH_SYMBOLS_TOOL.inputSchema.properties.kind.type).toBe('string');
      expect(SEARCH_SYMBOLS_TOOL.inputSchema.properties.kind.enum).toEqual([
        'class',
        'function',
        'interface',
        'type',
        'const',
        'enum',
      ]);
    });

    it('should define input schema with limit parameter', () => {
      expect(SEARCH_SYMBOLS_TOOL.inputSchema.properties.limit).toBeDefined();
      expect(SEARCH_SYMBOLS_TOOL.inputSchema.properties.limit.type).toBe('number');
      expect(SEARCH_SYMBOLS_TOOL.inputSchema.properties.limit.default).toBe(10);
    });

    it('should mark query as required', () => {
      expect(SEARCH_SYMBOLS_TOOL.inputSchema.required).toContain('query');
    });

    it('should not mark kind or limit as required', () => {
      expect(SEARCH_SYMBOLS_TOOL.inputSchema.required).not.toContain('kind');
      expect(SEARCH_SYMBOLS_TOOL.inputSchema.required).not.toContain('limit');
    });
  });

  describe('input validation', () => {
    it('should reject empty string query', async () => {
      const input: SearchSymbolsInput = { query: '' };

      await expect(handler(input)).rejects.toThrow('Query parameter is required');
    });

    it('should reject whitespace-only query', async () => {
      const input: SearchSymbolsInput = { query: '   ' };

      await expect(handler(input)).rejects.toThrow('Query parameter cannot be empty');
    });

    it('should reject invalid kind', async () => {
      const input: SearchSymbolsInput = { query: 'test', kind: 'module' };

      await expect(handler(input)).rejects.toThrow('Invalid kind parameter');
    });

    it('should reject negative limit', async () => {
      const input = { query: 'test', limit: -1 };

      await expect(handler(input as SearchSymbolsInput)).rejects.toThrow(
        'Limit parameter must be a non-negative number'
      );
    });

    it('should reject non-number limit', async () => {
      const input = { query: 'test', limit: 'invalid' };

      await expect(handler(input as any)).rejects.toThrow('Limit parameter must be a non-negative number');
    });
  });

  describe('successful search', () => {
    it('should return results for valid query', async () => {
      const input: SearchSymbolsInput = { query: 'Diagram' };

      const output = await handler(input);

      expect(output.results).toBeDefined();
      expect(output.results.length).toBeGreaterThan(0);
    });

    it('should return results with all required fields', async () => {
      const input: SearchSymbolsInput = { query: 'DiagramComponent' };

      const output = await handler(input);

      expect(output.results.length).toBeGreaterThan(0);
      const result = output.results[0];
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('kind');
      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('importPath');
    });

    it('should not include jsDoc in results', async () => {
      const input: SearchSymbolsInput = { query: 'DiagramComponent' };

      const output = await handler(input);

      expect(output.results.length).toBeGreaterThan(0);
      expect(output.results[0]).not.toHaveProperty('jsDoc');
    });

    it('should respect limit', async () => {
      const input: SearchSymbolsInput = { query: 'Diagram', limit: 1 };

      const output = await handler(input);

      expect(output.results).toHaveLength(1);
    });

    it('should handle limit of 0', async () => {
      const input: SearchSymbolsInput = { query: 'Diagram', limit: 0 };

      const output = await handler(input);

      expect(output.results).toHaveLength(0);
    });
  });

  describe('kind filtering', () => {
    it('should filter results by kind', async () => {
      const input: SearchSymbolsInput = { query: 'Diagram', kind: 'class' };

      const output = await handler(input);

      expect(output.results.length).toBeGreaterThan(0);
      output.results.forEach((result) => {
        expect(result.kind).toBe('class');
      });
    });

    it('should return empty when kind does not match', async () => {
      const input: SearchSymbolsInput = { query: 'DiagramComponent', kind: 'function' };

      const output = await handler(input);

      expect(output.results).toEqual([]);
    });

    it('should filter by function kind', async () => {
      const input: SearchSymbolsInput = { query: 'provide', kind: 'function' };

      const output = await handler(input);

      expect(output.results.length).toBeGreaterThan(0);
      expect(output.results[0].name).toBe('provideNgDiagram');
    });
  });

  describe('no results', () => {
    it('should return empty array for non-matching queries', async () => {
      const input: SearchSymbolsInput = { query: 'nonexistent-xyz-123' };

      const output = await handler(input);

      expect(output.results).toEqual([]);
    });

    it('should not throw error when no results found', async () => {
      const input: SearchSymbolsInput = { query: 'nonexistent' };

      await expect(handler(input)).resolves.toBeDefined();
    });
  });

  describe('fuzzy and prefix matching', () => {
    it('should match prefix queries', async () => {
      const input: SearchSymbolsInput = { query: 'provid' };

      const output = await handler(input);

      expect(output.results.length).toBeGreaterThan(0);
      expect(output.results[0].name).toBe('provideNgDiagram');
    });

    it('should match partial names', async () => {
      const input: SearchSymbolsInput = { query: 'Edge' };

      const output = await handler(input);

      expect(output.results.length).toBeGreaterThan(0);
      expect(output.results[0].name).toBe('EdgeType');
    });

    it('should handle case-insensitive search', async () => {
      const input: SearchSymbolsInput = { query: 'diagram' };

      const output = await handler(input);

      expect(output.results.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should wrap errors with meaningful message', async () => {
      const brokenEngine = {
        search: () => {
          throw new Error('Index corrupted');
        },
      } as unknown as SymbolSearchEngine;

      const brokenHandler = createSearchSymbolsHandler(brokenEngine);
      const input: SearchSymbolsInput = { query: 'test' };

      await expect(brokenHandler(input)).rejects.toThrow('Symbol search failed: Index corrupted');
    });

    it('should handle unknown errors gracefully', async () => {
      const brokenEngine = {
        search: () => {
          throw 'String error';
        },
      } as unknown as SymbolSearchEngine;

      const brokenHandler = createSearchSymbolsHandler(brokenEngine);
      const input: SearchSymbolsInput = { query: 'test' };

      await expect(brokenHandler(input)).rejects.toThrow('Symbol search failed: Unknown error occurred');
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in query', async () => {
      const input: SearchSymbolsInput = { query: 'ng-diagram' };

      const output = await handler(input);

      expect(output.results).toBeDefined();
    });

    it('should handle very long queries', async () => {
      const input: SearchSymbolsInput = { query: 'a'.repeat(1000) };

      const output = await handler(input);

      expect(output.results).toEqual([]);
    });

    it('should handle empty engine', async () => {
      const emptyEngine = new SymbolSearchEngine([]);
      const emptyHandler = createSearchSymbolsHandler(emptyEngine);
      const input: SearchSymbolsInput = { query: 'test' };

      const output = await emptyHandler(input);

      expect(output.results).toEqual([]);
    });

    it('should trim whitespace from query', async () => {
      const input: SearchSymbolsInput = { query: '  DiagramComponent  ' };

      const output = await handler(input);

      expect(output.results.length).toBeGreaterThan(0);
      expect(output.results[0].name).toBe('DiagramComponent');
    });
  });
});
