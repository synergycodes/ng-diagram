/**
 * Unit tests for camelCase tokenizer and symbol search ranking
 */

import { describe, expect, it } from 'vitest';
import { SymbolSearchEngine, tokenize } from '../src/services/symbol-search.js';
import type { ApiSymbol } from '../src/types/index.js';

describe('tokenize', () => {
  it('should return single token for simple word', () => {
    expect(tokenize('Diagram')).toEqual(['Diagram']);
  });

  it('should split PascalCase into parts and keep original', () => {
    expect(tokenize('DiagramComponent')).toEqual(['DiagramComponent', 'Diagram', 'Component']);
  });

  it('should split camelCase into parts and keep original', () => {
    expect(tokenize('ngDiagram')).toEqual(['ngDiagram', 'ng', 'Diagram']);
  });

  it('should split multiple PascalCase segments', () => {
    expect(tokenize('NgDiagramMath')).toEqual(['NgDiagramMath', 'Ng', 'Diagram', 'Math']);
  });

  it('should split on underscore without keeping original', () => {
    expect(tokenize('DEFAULT_CONFIG')).toEqual(['DEFAULT', 'CONFIG']);
  });

  it('should split on spaces', () => {
    expect(tokenize('export interface')).toEqual(['export', 'interface']);
  });

  it('should handle consecutive uppercase followed by lowercase (e.g. HTMLElement)', () => {
    const tokens = tokenize('HTMLElement');
    expect(tokens).toContain('HTMLElement');
    expect(tokens).toContain('HTML');
    expect(tokens).toContain('Element');
  });

  it('should handle all-uppercase word as single token', () => {
    expect(tokenize('DEFAULT')).toEqual(['DEFAULT']);
  });

  it('should handle single character segments', () => {
    const tokens = tokenize('aB');
    expect(tokens).toContain('aB');
    expect(tokens).toContain('a');
    expect(tokens).toContain('B');
  });

  it('should handle mixed separators and camelCase', () => {
    const tokens = tokenize('my_DiagramComponent');
    expect(tokens).toContain('my');
    expect(tokens).toContain('DiagramComponent');
    expect(tokens).toContain('Diagram');
    expect(tokens).toContain('Component');
  });

  it('should return empty array for empty string', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('should return empty array for only separators', () => {
    expect(tokenize('___')).toEqual([]);
  });
});

describe('SymbolSearchEngine ranking', () => {
  const symbols: ApiSymbol[] = [
    {
      name: 'DiagramComponent',
      kind: 'class',
      signature: 'class DiagramComponent',
      importPath: 'ng-diagram',
    },
    {
      name: 'BaseEdgeComponent',
      kind: 'class',
      signature: 'class BaseEdgeComponent',
      importPath: 'ng-diagram',
    },
    {
      name: 'provideNgDiagram',
      kind: 'function',
      signature: 'function provideNgDiagram(): Provider',
      importPath: 'ng-diagram',
    },
    {
      name: 'DiagramConfig',
      kind: 'interface',
      signature: 'interface DiagramConfig { width?: number; }',
      importPath: 'ng-diagram',
    },
  ];

  it('should rank exact name match first', () => {
    const engine = new SymbolSearchEngine(symbols);
    const results = engine.search('DiagramComponent');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('DiagramComponent');
  });

  it('should rank exact name match above partial camelCase match', () => {
    const engine = new SymbolSearchEngine(symbols);
    const results = engine.search('DiagramConfig');

    expect(results[0].name).toBe('DiagramConfig');
  });

  it('should find symbols by camelCase segment', () => {
    const engine = new SymbolSearchEngine(symbols);
    const results = engine.search('Component');

    const names = results.map((r) => r.name);
    expect(names).toContain('DiagramComponent');
    expect(names).toContain('BaseEdgeComponent');
  });

  it('should find symbols by non-first camelCase segment', () => {
    const engine = new SymbolSearchEngine(symbols);
    const results = engine.search('Config');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('DiagramConfig');
  });

  it('should rank name match higher than signature-only match', () => {
    const engine = new SymbolSearchEngine(symbols);
    // "Provider" only appears in provideNgDiagram's signature, not in any name
    const results = engine.search('Provider');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('provideNgDiagram');
  });

  it('should find symbol by prefix of camelCase segment', () => {
    const engine = new SymbolSearchEngine(symbols);
    const results = engine.search('Comp');

    const names = results.map((r) => r.name);
    expect(names).toContain('DiagramComponent');
    expect(names).toContain('BaseEdgeComponent');
  });

  describe('serialization', () => {
    it('should produce identical search results after round-trip serialization', () => {
      const engine = new SymbolSearchEngine(symbols);
      const json = engine.toJSON();
      const restored = SymbolSearchEngine.fromJSON(json);

      const original = engine.search('DiagramComponent');
      const deserialized = restored.search('DiagramComponent');

      expect(deserialized).toEqual(original);
    });

    it('should preserve camelCase tokenizer after deserialization', () => {
      const engine = new SymbolSearchEngine(symbols);
      const restored = SymbolSearchEngine.fromJSON(engine.toJSON());

      const results = restored.search('Component');
      const names = results.map((r) => r.name);

      expect(names).toContain('DiagramComponent');
      expect(names).toContain('BaseEdgeComponent');
    });

    it('should preserve kind filtering after deserialization', () => {
      const engine = new SymbolSearchEngine(symbols);
      const restored = SymbolSearchEngine.fromJSON(engine.toJSON());

      const results = restored.search('Diagram', 'class');

      expect(results.every((r) => r.kind === 'class')).toBe(true);
    });
  });
});
