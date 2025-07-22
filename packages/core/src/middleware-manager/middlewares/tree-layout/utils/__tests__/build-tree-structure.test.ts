import { describe, expect, it } from 'vitest';
import { Edge, Node } from '../../../../../types';
import { TreeNode } from '../../../../../types/tree-layout.interface.ts';
import {
  buildGroupsHierarchy,
  buildTopGroupMap,
  buildTreeStructure,
  getNodeMap,
  remapEdges,
} from '../build-tree-structure.ts';

type PartialNode = Pick<Node, 'id' | 'position' | 'size' | 'type' | 'groupId'>;
type PartialEdge = Pick<Edge, 'source' | 'target'>;

describe('buildTreeStructure', () => {
  it('should build a single root tree', () => {
    const nodes: PartialNode[] = [
      { id: 'root', position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, type: 'Test' },
      { id: 'child1', position: { x: 0, y: 0 }, size: { width: 50, height: 25 }, type: 'Test' },
      { id: 'child2', position: { x: 0, y: 0 }, size: { width: 50, height: 25 }, type: 'Test' },
    ];
    const nodeMap = new Map(nodes.map((node) => [node.id, { ...node, children: [] } as TreeNode]));
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
    const nodeMap = new Map(nodes.map((node) => [node.id, { ...node, children: [] } as TreeNode]));
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
    const nodeMap = new Map(nodes.map((node) => [node.id, { ...node, children: [] } as TreeNode]));
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
    const nodeMap = new Map(nodes.map((node) => [node.id, { ...node, children: [] } as TreeNode]));
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
    const nodeMap = new Map(nodes.map((node) => [node.id, { ...node, children: [] } as TreeNode]));
    const edges: Edge[] = [];

    const { roots } = buildTreeStructure(nodeMap, edges);

    expect(roots.length).toBe(2);
    expect(roots.map((r) => r.id).sort()).toEqual(['x', 'y']);
    expect(roots[0].children.length).toBe(0);
    expect(roots[1].children.length).toBe(0);
  });
});

describe('buildTopGroupMap', () => {
  it('should return a map with node IDs as keys and their top group IDs as values', () => {
    const nodeMap = new Map<string, TreeNode>([
      ['node1', { id: 'node1', position: { x: 0, y: 0 }, children: [], type: 'Test' }],
      ['group1', { id: 'group1', position: { x: 0, y: 0 }, children: [], type: 'group' }],
      ['node2', { id: 'node2', position: { x: 0, y: 0 }, children: [], type: 'Test', groupId: 'group1' }],
    ]);

    const topGroupMap = buildTopGroupMap(nodeMap);

    expect(topGroupMap.get('node1')).toBe('node1');
    expect(topGroupMap.get('group1')).toBe('group1');
    expect(topGroupMap.get('node2')).toBe('group1');
  });

  it('should handle nested groups correctly', () => {
    const nodeMap = new Map<string, TreeNode>([
      ['topGroup', { id: 'topGroup', position: { x: 0, y: 0 }, children: [], type: 'group' }],
      [
        'nestedGroup',
        { id: 'nestedGroup', position: { x: 0, y: 0 }, children: [], type: 'group', groupId: 'topGroup' },
      ],
      ['deepNode', { id: 'deepNode', position: { x: 0, y: 0 }, children: [], type: 'Test', groupId: 'nestedGroup' }],
    ]);

    const topGroupMap = buildTopGroupMap(nodeMap);

    expect(topGroupMap.get('topGroup')).toBe('topGroup');
    expect(topGroupMap.get('nestedGroup')).toBe('topGroup');
    expect(topGroupMap.get('deepNode')).toBe('topGroup');
  });

  it('should handle nodes with no group', () => {
    const nodeMap = new Map<string, TreeNode>([
      ['standalone', { id: 'standalone', position: { x: 0, y: 0 }, children: [], type: 'Test' }],
    ]);

    const topGroupMap = buildTopGroupMap(nodeMap);

    expect(topGroupMap.get('standalone')).toBe('standalone');
  });

  it('should handle empty nodeMap', () => {
    const nodeMap = new Map<string, TreeNode>();

    const topGroupMap = buildTopGroupMap(nodeMap);

    expect(topGroupMap.size).toBe(0);
  });
});

describe('remapEdges', () => {
  it('should remap edges to use top group IDs', () => {
    const edges: Edge[] = [
      { id: '1', source: 'node1', target: 'node2', type: 'test', data: {} },
      { id: '2', source: 'node3', target: 'node4', type: 'test', data: {} },
    ];
    const topGroupMap = new Map([
      ['node1', 'group1'],
      ['node2', 'group2'],
      ['node3', 'node3'],
      ['node4', 'group2'],
    ]);

    const remappedEdges = remapEdges(edges, topGroupMap);

    expect(remappedEdges).toEqual([
      { id: '1', source: 'group1', target: 'group2', type: 'test', data: {} },
      { id: '2', source: 'node3', target: 'group2', type: 'test', data: {} },
    ]);
  });

  it('should use original node ID when not in topGroupMap', () => {
    const edges: Edge[] = [{ id: '1', source: 'node1', target: 'node2', type: 'test', data: {} }];
    const topGroupMap = new Map([['node1', 'group1']]);

    const remappedEdges = remapEdges(edges, topGroupMap);

    expect(remappedEdges).toEqual([{ id: '1', source: 'group1', target: 'node2', type: 'test', data: {} }]);
  });

  it('should handle empty edges array', () => {
    const edges: Edge[] = [];
    const topGroupMap = new Map([['node1', 'group1']]);

    const remappedEdges = remapEdges(edges, topGroupMap);

    expect(remappedEdges).toEqual([]);
  });
});

describe('buildGroupsHierarchy', () => {
  it('should build hierarchy with group children', () => {
    const nodeMap = new Map<string, TreeNode>([
      ['topGroup', { id: 'topGroup', position: { x: 0, y: 0 }, children: [], type: 'group' }],
      ['node1', { id: 'node1', position: { x: 0, y: 0 }, children: [], type: 'Test', groupId: 'topGroup' }],
      ['node2', { id: 'node2', position: { x: 0, y: 0 }, children: [], type: 'Test', groupId: 'topGroup' }],
    ]);

    const hierarchy = buildGroupsHierarchy(nodeMap);

    expect(hierarchy.length).toBe(1);
    expect(hierarchy[0].id).toBe('topGroup');
    expect(hierarchy[0].groupChildren).toBeDefined();
    expect(hierarchy[0].groupChildren!.length).toBe(2);
    expect(hierarchy[0].groupChildren!.map((c) => c.id).sort()).toEqual(['node1', 'node2']);
  });

  it('should handle nested groups', () => {
    const nodeMap = new Map<string, TreeNode>([
      ['topGroup', { id: 'topGroup', position: { x: 0, y: 0 }, children: [], type: 'group' }],
      [
        'nestedGroup',
        { id: 'nestedGroup', position: { x: 0, y: 0 }, children: [], type: 'group', groupId: 'topGroup' },
      ],
      ['node1', { id: 'node1', position: { x: 0, y: 0 }, children: [], type: 'Test', groupId: 'nestedGroup' }],
    ]);

    const hierarchy = buildGroupsHierarchy(nodeMap);

    expect(hierarchy.length).toBe(1);
    expect(hierarchy[0].id).toBe('topGroup');
    expect(hierarchy[0].groupChildren!.length).toBe(1);
    expect(hierarchy[0].groupChildren![0].id).toBe('nestedGroup');
    expect(hierarchy[0].groupChildren![0].groupChildren!.length).toBe(1);
    expect(hierarchy[0].groupChildren![0].groupChildren![0].id).toBe('node1');
  });

  it('should return multiple top-level groups', () => {
    const nodeMap = new Map<string, TreeNode>([
      ['group1', { id: 'group1', position: { x: 0, y: 0 }, children: [], type: 'group' }],
      ['group2', { id: 'group2', position: { x: 0, y: 0 }, children: [], type: 'group' }],
    ]);

    const hierarchy = buildGroupsHierarchy(nodeMap);

    expect(hierarchy.length).toBe(2);
    expect(hierarchy.map((g) => g.id).sort()).toEqual(['group1', 'group2']);
  });

  it('should handle empty nodeMap', () => {
    const nodeMap = new Map<string, TreeNode>();

    const hierarchy = buildGroupsHierarchy(nodeMap);

    expect(hierarchy).toEqual([]);
  });

  it('should initialize groupChildren for all group nodes', () => {
    const nodeMap = new Map<string, TreeNode>([
      ['group1', { id: 'group1', position: { x: 0, y: 0 }, children: [], type: 'group' }],
      ['node1', { id: 'node1', position: { x: 0, y: 0 }, children: [], type: 'Test' }],
    ]);

    buildGroupsHierarchy(nodeMap);

    expect(nodeMap.get('group1')!.groupChildren).toEqual([]);
  });
});

describe('getNodeMap', () => {
  it('should create TreeNode map from Node array', () => {
    const nodes: Pick<Node, 'id' | 'position' | 'size' | 'layoutConfiguration' | 'type' | 'groupId'>[] = [
      {
        id: 'node1',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        type: 'Test',
        layoutConfiguration: {
          tree: {
            layoutAngle: 90,
            layoutAlignment: 'Parent',
          },
        },
      },
      {
        id: 'node2',
        position: { x: 30, y: 40 },
        type: 'Test',
        groupId: 'group1',
      },
    ];

    const nodeMap = getNodeMap(nodes);

    expect(nodeMap.size).toBe(2);

    const node1 = nodeMap.get('node1')!;
    expect(node1.id).toBe('node1');
    expect(node1.position).toEqual({ x: 10, y: 20 });
    expect(node1.size).toEqual({ width: 100, height: 50 });
    expect(node1.children).toEqual([]);
    expect(node1.layoutAngle).toBe(90);
    expect(node1.layoutAlignment).toBe('Parent');
    expect(node1.type).toBe('Test');
    expect(node1.groupId).toBeUndefined();

    const node2 = nodeMap.get('node2')!;
    expect(node2.id).toBe('node2');
    expect(node2.position).toEqual({ x: 30, y: 40 });
    expect(node2.size).toBeUndefined();
    expect(node2.children).toEqual([]);
    expect(node2.layoutAngle).toBeUndefined();
    expect(node2.layoutAlignment).toBeUndefined();
    expect(node2.type).toBe('Test');
    expect(node2.groupId).toBe('group1');
  });

  it('should handle nodes without size', () => {
    const nodes: Pick<Node, 'id' | 'position' | 'size' | 'layoutConfiguration' | 'type' | 'groupId'>[] = [
      { id: 'node1', position: { x: 0, y: 0 }, type: 'Test' },
    ];

    const nodeMap = getNodeMap(nodes);

    expect(nodeMap.get('node1')!.size).toBeUndefined();
  });

  it('should handle nodes without layoutConfiguration', () => {
    const nodes: Pick<Node, 'id' | 'position' | 'size' | 'layoutConfiguration' | 'type' | 'groupId'>[] = [
      { id: 'node1', position: { x: 0, y: 0 }, type: 'Test' },
    ];

    const nodeMap = getNodeMap(nodes);

    const node = nodeMap.get('node1')!;
    expect(node.layoutAngle).toBeUndefined();
    expect(node.layoutAlignment).toBeUndefined();
  });

  it('should deep copy position and size objects', () => {
    const originalPosition = { x: 10, y: 20 };
    const originalSize = { width: 100, height: 50 };
    const nodes: Pick<Node, 'id' | 'position' | 'size' | 'layoutConfiguration' | 'type' | 'groupId'>[] = [
      {
        id: 'node1',
        position: originalPosition,
        size: originalSize,
        type: 'Test',
      },
    ];

    const nodeMap = getNodeMap(nodes);
    const treeNode = nodeMap.get('node1')!;

    // Modify original objects
    originalPosition.x = 999;
    originalSize.width = 999;

    // TreeNode should have copies, not references
    expect(treeNode.position.x).toBe(10);
    expect(treeNode.size!.width).toBe(100);
  });

  it('should handle empty nodes array', () => {
    const nodes: Pick<Node, 'id' | 'position' | 'size' | 'layoutConfiguration' | 'type' | 'groupId'>[] = [];

    const nodeMap = getNodeMap(nodes);

    expect(nodeMap.size).toBe(0);
  });
});
