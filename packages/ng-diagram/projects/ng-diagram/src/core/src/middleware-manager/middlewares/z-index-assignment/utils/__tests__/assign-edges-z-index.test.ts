import { describe, expect, it } from 'vitest';
import { assignEdgesZIndex, assignEdgeZIndex } from '../assign-edges-z-index';

const makeNode = (id: string, computedZIndex?: number) => ({
  id,
  computedZIndex,
  type: 'node' as const,
  position: { x: 0, y: 0 },
  data: {},
});

const makeEdge = (id: string, source: string, target: string, extra: Record<string, unknown> = {}) => ({
  id,
  source,
  target,
  data: {},
  ...extra,
});

describe('assignEdgeZIndex', () => {
  it('should use max of source and target z-index from zIndexMap', () => {
    const zIndexMap = new Map([
      ['src', 3],
      ['tgt', 7],
    ]);
    const nodesMap = new Map();

    const result = assignEdgeZIndex(makeEdge('e1', 'src', 'tgt'), zIndexMap, nodesMap);

    expect(result.computedZIndex).toBe(7);
  });

  it('should fall back to nodesMap when node not in zIndexMap', () => {
    const zIndexMap = new Map([['src', 3]]);
    const nodesMap = new Map([['tgt', makeNode('tgt', 10)]]);

    const result = assignEdgeZIndex(makeEdge('e1', 'src', 'tgt'), zIndexMap, nodesMap);

    expect(result.computedZIndex).toBe(10);
  });

  it('should default to 0 when node missing from both maps', () => {
    const zIndexMap = new Map();
    const nodesMap = new Map();

    const result = assignEdgeZIndex(makeEdge('e1', 'missing1', 'missing2'), zIndexMap, nodesMap);

    expect(result.computedZIndex).toBe(0);
  });

  it('should use edge zOrder when present', () => {
    const zIndexMap = new Map([
      ['src', 3],
      ['tgt', 7],
    ]);
    const nodesMap = new Map();

    const result = assignEdgeZIndex(makeEdge('e1', 'src', 'tgt', { zOrder: 99 }), zIndexMap, nodesMap);

    expect(result.computedZIndex).toBe(99);
  });

  it('should add 1 to max when edgesAboveConnectedNodes is true', () => {
    const zIndexMap = new Map([
      ['src', 3],
      ['tgt', 7],
    ]);
    const nodesMap = new Map();

    const result = assignEdgeZIndex(makeEdge('e1', 'src', 'tgt'), zIndexMap, nodesMap, true);

    expect(result.computedZIndex).toBe(8);
  });

  it('should use zOrder over edgesAboveConnectedNodes when both present', () => {
    const zIndexMap = new Map([
      ['src', 3],
      ['tgt', 7],
    ]);
    const nodesMap = new Map();

    const result = assignEdgeZIndex(makeEdge('e1', 'src', 'tgt', { zOrder: 2 }), zIndexMap, nodesMap, true);

    expect(result.computedZIndex).toBe(2);
  });
});

describe('assignEdgesZIndex', () => {
  it('should assign z-index to all edges using nodesWithZIndex', () => {
    const nodesWithZIndex = [makeNode('src', 5), makeNode('tgt', 2)];
    const nodesMap = new Map();

    const edges = [makeEdge('e1', 'src', 'tgt'), makeEdge('e2', 'tgt', 'src'), makeEdge('e3', 'src', 'src')];
    const result = assignEdgesZIndex(edges, nodesWithZIndex, nodesMap);

    expect(result[0].computedZIndex).toBe(5);
    expect(result[1].computedZIndex).toBe(5);
    expect(result[2].computedZIndex).toBe(5);
  });

  it('should respect edgesAboveConnectedNodes for all edges', () => {
    const nodesWithZIndex = [makeNode('src', 5), makeNode('tgt', 2)];
    const nodesMap = new Map();

    const edges = [makeEdge('e1', 'src', 'tgt'), makeEdge('e2', 'tgt', 'src')];
    const result = assignEdgesZIndex(edges, nodesWithZIndex, nodesMap, true);

    expect(result[0].computedZIndex).toBe(6);
    expect(result[1].computedZIndex).toBe(6);
  });

  it('should respect edge zOrder in batch processing', () => {
    const nodesWithZIndex = [makeNode('src', 5), makeNode('tgt', 2)];
    const nodesMap = new Map();

    const edges = [makeEdge('e1', 'src', 'tgt', { zOrder: 42 }), makeEdge('e2', 'src', 'tgt')];
    const result = assignEdgesZIndex(edges, nodesWithZIndex, nodesMap);

    expect(result[0].computedZIndex).toBe(42);
    expect(result[1].computedZIndex).toBe(5);
  });
});
