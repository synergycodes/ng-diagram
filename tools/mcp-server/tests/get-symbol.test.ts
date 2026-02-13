/**
 * Unit tests for get_symbol tool handler
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { ApiReportIndexer } from '../src/services/api-indexer.js';
import { createGetSymbolHandler, GET_SYMBOL_TOOL } from '../src/tools/get-symbol/index.js';
import type { GetSymbolInput } from '../src/tools/get-symbol/tool.types.js';

describe('get_symbol tool', () => {
  let apiIndexer: ApiReportIndexer;
  let handler: ReturnType<typeof createGetSymbolHandler>;

  beforeEach(() => {
    apiIndexer = {
      getSymbol: (name: string) => {
        const symbols = [
          {
            name: 'DiagramComponent',
            kind: 'class' as const,
            signature: 'class DiagramComponent',
            importPath: 'ng-diagram',
            jsDoc: 'Main diagram component for rendering directed graphs.',
          },
          {
            name: 'provideNgDiagram',
            kind: 'function' as const,
            signature: 'function provideNgDiagram(config?: DiagramConfig): Provider',
            importPath: 'ng-diagram',
          },
          {
            name: 'DiagramConfig',
            kind: 'interface' as const,
            signature: 'interface DiagramConfig {\n  width?: number;\n  height?: number;\n}',
            importPath: 'ng-diagram',
          },
        ];
        return symbols.find((s) => s.name === name);
      },
    } as unknown as ApiReportIndexer;

    handler = createGetSymbolHandler(apiIndexer);
  });

  describe('tool schema definition', () => {
    it('should have correct tool name', () => {
      expect(GET_SYMBOL_TOOL.name).toBe('get_symbol');
    });

    it('should have a description', () => {
      expect(GET_SYMBOL_TOOL.description).toBeDefined();
      expect(GET_SYMBOL_TOOL.description.length).toBeGreaterThan(0);
    });

    it('should define input schema with name parameter', () => {
      expect(GET_SYMBOL_TOOL.inputSchema.properties.name).toBeDefined();
      expect(GET_SYMBOL_TOOL.inputSchema.properties.name.type).toBe('string');
    });

    it('should mark name as required', () => {
      expect(GET_SYMBOL_TOOL.inputSchema.required).toContain('name');
    });
  });

  describe('input validation', () => {
    it('should reject empty name', async () => {
      const input: GetSymbolInput = { name: '' };

      await expect(handler(input)).rejects.toThrow('Name parameter is required');
    });

    it('should reject whitespace-only name', async () => {
      const input: GetSymbolInput = { name: '   ' };

      await expect(handler(input)).rejects.toThrow('Name parameter cannot be empty');
    });
  });

  describe('successful retrieval', () => {
    it('should return all fields for a known symbol', async () => {
      const input: GetSymbolInput = { name: 'DiagramComponent' };

      const output = await handler(input);

      expect(output.name).toBe('DiagramComponent');
      expect(output.kind).toBe('class');
      expect(output.signature).toBe('class DiagramComponent');
      expect(output.jsDoc).toBe('Main diagram component for rendering directed graphs.');
      expect(output.importStatement).toBe("import { DiagramComponent } from 'ng-diagram';");
    });

    it('should return correct import statement format', async () => {
      const input: GetSymbolInput = { name: 'provideNgDiagram' };

      const output = await handler(input);

      expect(output.importStatement).toBe("import { provideNgDiagram } from 'ng-diagram';");
    });
  });

  describe('jsDoc handling', () => {
    it('should include jsDoc when symbol has it', async () => {
      const input: GetSymbolInput = { name: 'DiagramComponent' };

      const output = await handler(input);

      expect(output.jsDoc).toBeDefined();
      expect(output.jsDoc).toBe('Main diagram component for rendering directed graphs.');
    });

    it('should omit jsDoc when symbol does not have it', async () => {
      const input: GetSymbolInput = { name: 'provideNgDiagram' };

      const output = await handler(input);

      expect(output.jsDoc).toBeUndefined();
    });
  });

  describe('symbol not found', () => {
    it('should return error for non-existent symbol', async () => {
      const input: GetSymbolInput = { name: 'NonExistentSymbol' };

      await expect(handler(input)).rejects.toThrow('Symbol not found: NonExistentSymbol');
    });
  });

  describe('case sensitivity', () => {
    it('should not match case-insensitive names', async () => {
      const input: GetSymbolInput = { name: 'diagramcomponent' };

      await expect(handler(input)).rejects.toThrow('Symbol not found: diagramcomponent');
    });

    it('should not match differently cased names', async () => {
      const input: GetSymbolInput = { name: 'DIAGRAMCOMPONENT' };

      await expect(handler(input)).rejects.toThrow('Symbol not found: DIAGRAMCOMPONENT');
    });
  });

  describe('error handling', () => {
    it('should wrap errors with meaningful message', async () => {
      const brokenIndexer = {
        getSymbol: () => {
          throw new Error('Index corrupted');
        },
      } as unknown as ApiReportIndexer;

      const brokenHandler = createGetSymbolHandler(brokenIndexer);
      const input: GetSymbolInput = { name: 'test' };

      await expect(brokenHandler(input)).rejects.toThrow('Get symbol failed: Index corrupted');
    });

    it('should handle unknown errors gracefully', async () => {
      const brokenIndexer = {
        getSymbol: () => {
          throw 'String error';
        },
      } as unknown as ApiReportIndexer;

      const brokenHandler = createGetSymbolHandler(brokenIndexer);
      const input: GetSymbolInput = { name: 'test' };

      await expect(brokenHandler(input)).rejects.toThrow('Get symbol failed: Unknown error occurred');
    });
  });
});
