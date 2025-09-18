import { describe, expect, it } from 'vitest';
import { assignEdgesZIndex, assignEdgeZIndex } from '../assign-edges-z-index';

describe('assignEdgeZIndex', () => {
  const nodesMap = new Map([
    ['1', { id: '1', computedZIndex: 3, type: 'node', position: { x: 0, y: 0 }, data: {} }],
    ['2', { id: '2', computedZIndex: 7, type: 'node', position: { x: 0, y: 0 }, data: {} }],
    ['3', { id: '3', type: 'node', position: { x: 0, y: 0 }, data: {} }],
    ['4', { id: '4', type: 'node', position: { x: 0, y: 0 }, data: {} }],
  ]);

  const zIndexMap = new Map([
    ['1', 3],
    ['1', 7],
  ]);

  it('should use zOrder if present', () => {
    const edge = { id: '1', data: {}, source: '1', target: '2', zOrder: 99 };
    const result = assignEdgeZIndex(edge, zIndexMap, nodesMap);
    expect(result.computedZIndex).toBe(99);
  });

  it('should use max zIndex from zIndexMap for source and target', () => {
    const edge = { id: '1', data: {}, source: '1', target: '2' };
    const result = assignEdgeZIndex(edge, zIndexMap, nodesMap);
    expect(result.computedZIndex).toBe(7);
  });

  it('should add 1 to max zIndex when edgesAboveConnectedNodes is true', () => {
    const edge = { id: '1', data: {}, source: '1', target: '2' };
    const result = assignEdgeZIndex(edge, zIndexMap, nodesMap, true);
    expect(result.computedZIndex).toBe(8);
  });

  it('should still respect zOrder when edgesAboveConnectedNodes is true', () => {
    const edge = { id: '1', data: {}, source: '1', target: '2', zOrder: 99 };
    const result = assignEdgeZIndex(edge, zIndexMap, nodesMap, true);
    expect(result.computedZIndex).toBe(99);
  });
});

describe('assignEdgesZIndex', () => {
  const nodesWithZIndex = [
    { id: '1', computedZIndex: 5, type: 'node', position: { x: 0, y: 0 }, data: {} },
    {
      id: '2',
      computedZIndex: 2,
      type: 'node',
      position: { x: 0, y: 0 },
      data: {},
    },
  ];

  const nodesMap = new Map([
    ['1', { id: '1', computedZIndex: 3, type: 'node', position: { x: 0, y: 0 }, data: {} }],
    ['2', { id: '2', computedZIndex: 7, type: 'node', position: { x: 0, y: 0 }, data: {} }],
    ['3', { id: '3', type: 'node', position: { x: 0, y: 0 }, data: {} }],
    ['4', { id: '4', type: 'node', position: { x: 0, y: 0 }, data: {} }],
  ]);

  it('should assign zIndex to all edges', () => {
    const edges = [
      { id: ' 1', source: '1', target: '2', data: {} },
      { id: '2', source: '1', target: '3', data: {} },
      { id: '3', source: '3', target: '2', data: {} },
      { id: '4', source: '3', target: '4', zOrder: 42, data: {} },
    ];
    const result = assignEdgesZIndex(edges, nodesWithZIndex, nodesMap);

    expect(result[0].computedZIndex).toBe(5);
    expect(result[1].computedZIndex).toBe(5);
    expect(result[2].computedZIndex).toBe(2);
    expect(result[3].computedZIndex).toBe(42);
  });

  it('should add 1 to zIndex when edgesAboveConnectedNodes is true', () => {
    const edges = [
      { id: '1', source: '1', target: '2', data: {} },
      { id: '2', source: '1', target: '3', data: {} },
      { id: '3', source: '3', target: '2', data: {} },
      { id: '4', source: '3', target: '4', zOrder: 42, data: {} },
    ];
    const result = assignEdgesZIndex(edges, nodesWithZIndex, nodesMap, true);

    expect(result[0].computedZIndex).toBe(6); // 5 + 1
    expect(result[1].computedZIndex).toBe(6); // 5 + 1
    expect(result[2].computedZIndex).toBe(3); // 2 + 1
    expect(result[3].computedZIndex).toBe(42); // zOrder is respected
  });
});
