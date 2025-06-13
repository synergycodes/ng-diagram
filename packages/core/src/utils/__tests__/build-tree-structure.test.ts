import { describe, expect, it } from 'vitest';
import { buildTreeStructure } from '../build-tree-structure.ts';
import { Edge, Node } from '../../types';

type PartialNode = Pick<Node, 'id' | 'position' | 'size'>;
type PartialEdge = Pick<Edge, 'source' | 'target'>;

describe('buildTreeStructure', () => {
  it('should build a single root tree', () => {
    const nodes: PartialNode[] = [
      { id: 'root', position: { x: 0, y: 0 }, size: { width: 100, height: 50 } },
      { id: 'child1', position: { x: 0, y: 0 }, size: { width: 50, height: 25 } },
      { id: 'child2', position: { x: 0, y: 0 }, size: { width: 50, height: 25 } },
    ];
    const edges: PartialEdge[] = [
      { source: 'root', target: 'child1' },
      { source: 'root', target: 'child2' },
    ];

    const { roots, nodeMap } = buildTreeStructure(nodes, edges);

    expect(roots.length).toBe(1);
    expect(roots[0].id).toBe('root');
    expect(roots[0].children.length).toBe(2);
    expect(roots[0].children.map((c) => c.id).sort()).toEqual(['child1', 'child2']);
    expect(nodeMap.size).toBe(3);
  });

  it('should not mutate the original nodes', () => {
    const nodes: PartialNode[] = [
      { id: 'root', position: { x: 0, y: 0 } },
      { id: 'leaf', position: { x: 0, y: 0 } },
    ];
    const edges: PartialEdge[] = [{ source: 'root', target: 'leaf' }];

    const nodesCopy = JSON.parse(JSON.stringify(nodes));
    buildTreeStructure(nodes, edges);

    expect(nodes).toEqual(nodesCopy);
  });

  it('should handle multiple roots', () => {
    const nodes: PartialNode[] = [
      { id: 'a', position: { x: 0, y: 0 } },
      { id: 'b', position: { x: 0, y: 0 } },
      { id: 'c', position: { x: 0, y: 0 } },
    ];
    const edges: PartialEdge[] = [{ source: 'a', target: 'b' }];

    const { roots } = buildTreeStructure(nodes, edges);
    const rootIds = roots.map((r) => r.id).sort();

    expect(rootIds).toEqual(['a', 'c']);
    expect(roots.find((r) => r.id === 'a')!.children[0].id).toBe('b');
    expect(roots.find((r) => r.id === 'c')!.children.length).toBe(0);
  });

  it('should not add the same child twice', () => {
    const nodes: PartialNode[] = [
      { id: 'root', position: { x: 0, y: 0 } },
      { id: 'child', position: { x: 0, y: 0 } },
    ];
    const edges: PartialEdge[] = [
      { source: 'root', target: 'child' },
      { source: 'root', target: 'child' },
    ];

    const { roots } = buildTreeStructure(nodes, edges);

    expect(roots[0].children.length).toBe(1);
    expect(roots[0].children[0].id).toBe('child');
  });

  it('should handle nodes with no edges (all roots)', () => {
    const nodes: PartialNode[] = [
      { id: 'x', position: { x: 0, y: 0 } },
      { id: 'y', position: { x: 0, y: 0 } },
    ];
    const edges: Edge[] = [];

    const { roots } = buildTreeStructure(nodes, edges);

    expect(roots.length).toBe(2);
    expect(roots.map((r) => r.id).sort()).toEqual(['x', 'y']);
    expect(roots[0].children.length).toBe(0);
    expect(roots[1].children.length).toBe(0);
  });
});
