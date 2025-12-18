import { describe, expect, it } from 'vitest';
import type { FlowCore } from '../flow-core';
import { mockEdge, mockNode } from '../test-utils';
import type { Edge, Node } from '../types';
import { DirectRenderStrategy } from './direct-render-strategy';

describe('DirectRenderStrategy', () => {
  const mockFlowCore = {} as FlowCore;
  const strategy = new DirectRenderStrategy(mockFlowCore);

  it('should return all nodes and edges unchanged', () => {
    const nodes: Node[] = [
      { ...mockNode, id: '1', position: { x: 0, y: 0 }, size: { width: 50, height: 50 } },
      { ...mockNode, id: '2', position: { x: 1000, y: 1000 }, size: { width: 50, height: 50 } },
      { ...mockNode, id: '3', position: { x: 5000, y: 5000 }, size: { width: 50, height: 50 } },
    ];
    const edges: Edge[] = [
      { ...mockEdge, id: 'e1', source: '1', target: '2' },
      { ...mockEdge, id: 'e2', source: '2', target: '3' },
    ];

    const result = strategy.process(nodes, edges);

    expect(result.nodes).toBe(nodes);
    expect(result.edges).toBe(edges);
  });

  it('should return empty sets for nodeIds and edgeIds', () => {
    const nodes: Node[] = [{ ...mockNode, id: '1', position: { x: 0, y: 0 }, size: { width: 50, height: 50 } }];
    const edges: Edge[] = [];

    const result = strategy.process(nodes, edges);

    expect(result.nodeIds.size).toBe(0);
    expect(result.edgeIds.size).toBe(0);
  });

  it('should work with undefined viewport', () => {
    const nodes: Node[] = [{ ...mockNode, id: '1', position: { x: 0, y: 0 }, size: { width: 50, height: 50 } }];
    const edges: Edge[] = [];

    const result = strategy.process(nodes, edges);

    expect(result.nodes).toBe(nodes);
    expect(result.edges).toBe(edges);
  });

  it('should reuse the same empty set instance across calls', () => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const result1 = strategy.process(nodes, edges);
    const result2 = strategy.process(nodes, edges);

    // Same empty set instance should be reused
    expect(result1.nodeIds).toBe(result2.nodeIds);
    expect(result1.edgeIds).toBe(result2.edgeIds);
  });
});
