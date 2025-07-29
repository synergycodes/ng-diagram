import { describe, expect, it } from 'vitest';
import { Edge, LayoutAlignmentType, LayoutAngleType, Node, TreeLayoutConfig } from '../../../../types';
import { TreeNode } from '../../../../types/tree-layout.interface.ts';
import {
  buildGroupsHierarchy,
  buildTopGroupMap,
  buildTreeStructure,
  getNodeMap,
  remapEdges,
} from './build-tree-structure.ts';

type PartialNode = Pick<Node, 'id' | 'position' | 'size' | 'type' | 'groupId'>;
type PartialEdge = Pick<Edge, 'source' | 'target'>;

// Mock TreeLayoutConfig for testing with specific values for some tests
const mockTreeLayoutConfigWithValues: TreeLayoutConfig = {
  getLayoutAngleForNode: (node: Node): LayoutAngleType | null => {
    if (node.id === 'node1') return 90;
    return null;
  },
  getLayoutAlignmentForNode: (node: Node): LayoutAlignmentType | null => {
    if (node.id === 'node1') return 'Parent';
    return null;
  },
};

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
    const nodes: Node[] = [
      {
        id: 'node1',
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
        type: 'Test',
        data: {},
      },
      {
        id: 'node2',
        position: { x: 30, y: 40 },
        type: 'Test',
        groupId: 'group1',
        data: {},
      },
    ];

    const nodeMap = getNodeMap(mockTreeLayoutConfigWithValues, nodes);

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
    const nodes: Node[] = [{ id: 'node1', position: { x: 0, y: 0 }, type: 'Test', data: {} }];

    const nodeMap = getNodeMap(mockTreeLayoutConfig, nodes);

    expect(nodeMap.get('node1')!.size).toBeUndefined();
  });

  it('should handle nodes with default layout configuration', () => {
    const nodes: Node[] = [{ id: 'node1', position: { x: 0, y: 0 }, type: 'Test', data: {} }];

    const nodeMap = getNodeMap(mockTreeLayoutConfig, nodes);

    const node = nodeMap.get('node1')!;
    expect(node.layoutAngle).toBeUndefined();
    expect(node.layoutAlignment).toBeUndefined();
  });

  it('should deep copy position and size objects', () => {
    const originalPosition = { x: 10, y: 20 };
    const originalSize = { width: 100, height: 50 };
    const nodes: Node[] = [
      {
        id: 'node1',
        position: originalPosition,
        size: originalSize,
        type: 'Test',
        data: {},
      },
    ];

    const nodeMap = getNodeMap(mockTreeLayoutConfig, nodes);
    const treeNode = nodeMap.get('node1')!;

    // Modify original objects
    originalPosition.x = 999;
    originalSize.width = 999;

    // TreeNode should have copies, not references
    expect(treeNode.position.x).toBe(10);
    expect(treeNode.size!.width).toBe(100);
  });

  it('should handle empty nodes array', () => {
    const nodes: Node[] = [];

    const nodeMap = getNodeMap(mockTreeLayoutConfig, nodes);

    expect(nodeMap.size).toBe(0);
  });
});

describe('TreeLayoutConfig integration', () => {
  it('should use getLayoutAngleForNode return value', () => {
    const mockConfig: TreeLayoutConfig = {
      getLayoutAngleForNode: (node: Node): LayoutAngleType | null => {
        if (node.id === 'special') return 180;
        return 90;
      },
      getLayoutAlignmentForNode: (): LayoutAlignmentType | null => null,
    };

    const nodes: Node[] = [
      { id: 'normal', position: { x: 0, y: 0 }, type: 'Test', data: {} },
      { id: 'special', position: { x: 0, y: 0 }, type: 'Test', data: {} },
    ];

    const nodeMap = getNodeMap(mockConfig, nodes);

    expect(nodeMap.get('normal')!.layoutAngle).toBe(90);
    expect(nodeMap.get('special')!.layoutAngle).toBe(180);
  });

  it('should use getLayoutAlignmentForNode return value', () => {
    const mockConfig: TreeLayoutConfig = {
      getLayoutAngleForNode: (): LayoutAngleType | null => null,
      getLayoutAlignmentForNode: (node: Node): LayoutAlignmentType | null => {
        if (node.id === 'center') return 'Subtree';
        return 'Start';
      },
    };

    const nodes: Node[] = [
      { id: 'left', position: { x: 0, y: 0 }, type: 'Test', data: {} },
      { id: 'center', position: { x: 0, y: 0 }, type: 'Test', data: {} },
    ];

    const nodeMap = getNodeMap(mockConfig, nodes);

    expect(nodeMap.get('left')!.layoutAlignment).toBe('Start');
    expect(nodeMap.get('center')!.layoutAlignment).toBe('Subtree');
  });

  it('should handle null return values from config methods', () => {
    const mockConfig: TreeLayoutConfig = {
      getLayoutAngleForNode: (): LayoutAngleType | null => null,
      getLayoutAlignmentForNode: (): LayoutAlignmentType | null => null,
    };

    const nodes: Node[] = [{ id: 'test', position: { x: 0, y: 0 }, type: 'Test', data: {} }];

    const nodeMap = getNodeMap(mockConfig, nodes);

    expect(nodeMap.get('test')!.layoutAngle).toBeUndefined();
    expect(nodeMap.get('test')!.layoutAlignment).toBeUndefined();
  });
});
