import { describe, expect, it } from 'vitest';
import { Edge, LayoutAlignmentType, LayoutAngleType, Node, TreeLayoutConfig } from '../../../types';
import { buildTreeStructure, getNodeMap } from '../tree-layout/utils/build-tree-structure';

type PartialNode = Pick<Node, 'id' | 'position' | 'size' | 'type' | 'groupId'>;
type PartialEdge = Pick<Edge, 'source' | 'target'>;

// Mock TreeLayoutConfig for testing
const mockTreeLayoutConfig: TreeLayoutConfig = {
  getLayoutAngleForNode: (): LayoutAngleType | null => null,
  getLayoutAlignmentForNode: (): LayoutAlignmentType | null => null,
};

describe('buildTreeStructure', () => {
  it('should build a single root tree', () => {
    const nodes: PartialNode[] = [
      { id: 'root', position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, type: 'Test' },
      { id: 'child1', position: { x: 0, y: 0 }, size: { width: 50, height: 25 }, type: 'Test' },
      { id: 'child2', position: { x: 0, y: 0 }, size: { width: 50, height: 25 }, type: 'Test' },
    ];
    const nodeMap = getNodeMap(mockTreeLayoutConfig, nodes as Node[]);
    const edges: PartialEdge[] = [
      { source: 'root', target: 'child1' },
      { source: 'root', target: 'child2' },
    ];

    const { roots } = buildTreeStructure(nodeMap, edges);

    expect(roots.length).toBe(1);
    expect(roots[0].id).toBe('root');
    expect(roots[0].children.length).toBe(2);
    expect(roots[0].children.map((c) => c.id).sort()).toEqual(['child1', 'child2']);
  });

  it('should not mutate the original nodes', () => {
    const nodes: PartialNode[] = [
      { id: 'root', position: { x: 0, y: 0 }, type: 'Test' },
      { id: 'leaf', position: { x: 0, y: 0 }, type: 'Test' },
    ];
    const nodeMap = getNodeMap(mockTreeLayoutConfig, nodes as Node[]);
    const edges: PartialEdge[] = [{ source: 'root', target: 'leaf' }];

    const nodesCopy = JSON.parse(JSON.stringify(nodes));
    buildTreeStructure(nodeMap, edges);

    expect(nodes).toEqual(nodesCopy);
  });

  it('should handle multiple roots', () => {
    const nodes: PartialNode[] = [
      { id: 'a', position: { x: 0, y: 0 }, type: 'Test' },
      { id: 'b', position: { x: 0, y: 0 }, type: 'Test' },
      { id: 'c', position: { x: 0, y: 0 }, type: 'Test' },
    ];
    const nodeMap = getNodeMap(mockTreeLayoutConfig, nodes as Node[]);
    const edges: PartialEdge[] = [{ source: 'a', target: 'b' }];

    const { roots } = buildTreeStructure(nodeMap, edges);
    const rootIds = roots.map((r) => r.id).sort();

    expect(rootIds).toEqual(['a', 'c']);
    expect(roots.find((r) => r.id === 'a')!.children[0].id).toBe('b');
    expect(roots.find((r) => r.id === 'c')!.children.length).toBe(0);
  });

  it('should not add the same child twice', () => {
    const nodes: PartialNode[] = [
      { id: 'root', position: { x: 0, y: 0 }, type: 'Test' },
      { id: 'child', position: { x: 0, y: 0 }, type: 'Test' },
    ];
    const nodeMap = getNodeMap(mockTreeLayoutConfig, nodes as Node[]);
    const edges: PartialEdge[] = [
      { source: 'root', target: 'child' },
      { source: 'root', target: 'child' },
    ];

    const { roots } = buildTreeStructure(nodeMap, edges);

    expect(roots[0].children.length).toBe(1);
    expect(roots[0].children[0].id).toBe('child');
  });

  it('should handle nodes with no edges (all roots)', () => {
    const nodes: PartialNode[] = [
      { id: 'x', position: { x: 0, y: 0 }, type: 'Test' },
      { id: 'y', position: { x: 0, y: 0 }, type: 'Test' },
    ];
    const nodeMap = getNodeMap(mockTreeLayoutConfig, nodes as Node[]);
    const edges: Edge[] = [];

    const { roots } = buildTreeStructure(nodeMap, edges);

    expect(roots.length).toBe(2);
    expect(roots.map((r) => r.id).sort()).toEqual(['x', 'y']);
    expect(roots[0].children.length).toBe(0);
    expect(roots[1].children.length).toBe(0);
  });

  it('should apply layout configuration from TreeLayoutConfig', () => {
    const configWithValues: TreeLayoutConfig = {
      getLayoutAngleForNode: (node: Node): LayoutAngleType | null => {
        return node.id === 'root' ? 270 : 90;
      },
      getLayoutAlignmentForNode: (node: Node): LayoutAlignmentType | null => {
        return node.id === 'root' ? 'Subtree' : 'Start';
      },
    };

    const nodes: PartialNode[] = [
      { id: 'root', position: { x: 0, y: 0 }, type: 'Test' },
      { id: 'child', position: { x: 0, y: 0 }, type: 'Test' },
    ];
    const nodeMap = getNodeMap(configWithValues, nodes as Node[]);

    const rootNode = nodeMap.get('root')!;
    const childNode = nodeMap.get('child')!;

    expect(rootNode.layoutAngle).toBe(270);
    expect(rootNode.layoutAlignment).toBe('Subtree');
    expect(childNode.layoutAngle).toBe(90);
    expect(childNode.layoutAlignment).toBe('Start');
  });
});
