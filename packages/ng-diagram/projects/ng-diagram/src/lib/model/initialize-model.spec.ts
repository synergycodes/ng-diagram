/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Edge, ModelAdapter, Node, Port } from '../../core/src';
import { EnvironmentProviderService } from '../services/environment-provider/environment-provider.service';
import { initializeModel, initializeModelAdapter } from './initialize-model';
import { SignalModelAdapter } from './signal-model-adapter';

const INTERNAL_ID_PATTERN = (nodeId: string) =>
  new RegExp(`^${nodeId}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`);

const mockNodes: Node[] = [
  { id: 'node1', type: 'default', data: { label: 'Node 1' }, position: { x: 0, y: 0 } },
  { id: 'node2', type: 'default', data: { label: 'Node 2' }, position: { x: 100, y: 50 } },
];

const mockEdges: Edge[] = [{ id: 'edge1', source: 'node1', target: 'node2', data: {} }];

function createMockPort(id: string, nodeId: string): Port {
  return {
    id,
    type: 'both',
    side: 'left',
    nodeId,
    size: { width: 10, height: 10 },
    position: { x: 0, y: 0 },
  };
}

function createNodesWithComputedProperties(): Node[] {
  return [
    {
      ...mockNodes[0],
      selected: true,
      measuredPorts: [createMockPort('port1', 'node1'), createMockPort('port2', 'node1')],
      measuredBounds: { x: -5, y: -5, width: 110, height: 60 },
      computedZIndex: 1,
      size: { width: 100, height: 50 },
    },
    {
      ...mockNodes[1],
      selected: false,
      measuredPorts: [createMockPort('port3', 'node2')],
      measuredBounds: { x: 95, y: 45, width: 110, height: 60 },
      computedZIndex: 2,
      size: { width: 100, height: 50 },
    },
  ];
}

function createEdgesWithComputedProperties(): Edge[] {
  return [
    {
      ...mockEdges[0],
      sourcePosition: { x: 10, y: 20 },
      targetPosition: { x: 200, y: 100 },
      points: [
        { x: 10, y: 20 },
        { x: 200, y: 100 },
      ],
      measuredLabels: [
        { id: 'label1', positionOnEdge: 0.5, size: { width: 50, height: 20 }, position: { x: 50, y: 25 } },
      ],
      computedZIndex: 0,
    },
  ];
}

function createMockModelAdapter(nodes: Node[] = [], edges: Edge[] = []): ModelAdapter {
  let _nodes = [...nodes];
  let _edges = [...edges];
  let _metadata = { viewport: { x: 0, y: 0, scale: 1 } };

  return {
    getNodes: () => _nodes,
    getEdges: () => _edges,
    getMetadata: () => _metadata,
    updateNodes: (next: any) => {
      _nodes = typeof next === 'function' ? next(_nodes) : next;
    },
    updateEdges: (next: any) => {
      _edges = typeof next === 'function' ? next(_edges) : next;
    },
    updateMetadata: (next: any) => {
      _metadata = typeof next === 'function' ? next(_metadata) : next;
    },
    onChange: vi.fn(),
    unregisterOnChange: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    toJSON: () => JSON.stringify({ nodes: _nodes, edges: _edges, metadata: _metadata }),
    destroy: vi.fn(),
  };
}

describe('initializeModel', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SignalModelAdapter, EnvironmentProviderService],
    });
  });

  it('should return a SignalModelAdapter', () => {
    const adapter = TestBed.runInInjectionContext(() => initializeModel({}));

    expect(adapter).toBeDefined();
    expect(typeof adapter.getNodes).toBe('function');
    expect(typeof adapter.getEdges).toBe('function');
  });

  it('should initialize with empty model', () => {
    const adapter = TestBed.runInInjectionContext(() => initializeModel({}));

    expect(adapter.getNodes()).toEqual([]);
    expect(adapter.getEdges()).toEqual([]);
  });

  it('should populate nodes with data', () => {
    const adapter = TestBed.runInInjectionContext(() => initializeModel({ nodes: mockNodes }));

    const nodes = adapter.getNodes();
    expect(nodes).toHaveLength(2);
    expect(nodes[0].id).toBe('node1');
    expect(nodes[0].data).toEqual({ label: 'Node 1' });
    expect(nodes[1].id).toBe('node2');
  });

  it('should populate edges with data', () => {
    const adapter = TestBed.runInInjectionContext(() => initializeModel({ nodes: mockNodes, edges: mockEdges }));

    const edges = adapter.getEdges();
    expect(edges).toHaveLength(1);
    expect(edges[0].id).toBe('edge1');
    expect(edges[0].source).toBe('node1');
    expect(edges[0].target).toBe('node2');
  });

  it('should assign _internalId to all nodes', () => {
    const adapter = TestBed.runInInjectionContext(() => initializeModel({ nodes: mockNodes }));

    const nodes = adapter.getNodes();
    for (const node of nodes) {
      expect((node as any)._internalId).toBeDefined();
      expect((node as any)._internalId).toMatch(INTERNAL_ID_PATTERN(node.id));
    }
  });

  it('should assign _internalId to all edges', () => {
    const adapter = TestBed.runInInjectionContext(() => initializeModel({ edges: mockEdges }));

    const edges = adapter.getEdges();
    for (const edge of edges) {
      expect((edge as any)._internalId).toBeDefined();
      expect((edge as any)._internalId).toMatch(INTERNAL_ID_PATTERN(edge.id));
    }
  });

  it('should assign unique _internalId to each node', () => {
    const adapter = TestBed.runInInjectionContext(() => initializeModel({ nodes: mockNodes }));

    const nodes = adapter.getNodes();
    const ids = nodes.map((n) => (n as any)._internalId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should apply metadata', () => {
    const adapter = TestBed.runInInjectionContext(() =>
      initializeModel({ metadata: { viewport: { x: 10, y: 20, scale: 2 } } })
    );

    expect(adapter.getMetadata().viewport).toEqual({ x: 10, y: 20, scale: 2 });
  });

  it('should strip selected from nodes', () => {
    const nodesWithComputed = createNodesWithComputedProperties();
    const adapter = TestBed.runInInjectionContext(() => initializeModel({ nodes: nodesWithComputed }));

    const nodes = adapter.getNodes();
    for (const node of nodes) {
      expect(node.selected).toBeUndefined();
    }
  });

  it('should strip measuredPorts from nodes', () => {
    const nodesWithComputed = createNodesWithComputedProperties();
    const adapter = TestBed.runInInjectionContext(() => initializeModel({ nodes: nodesWithComputed }));

    const nodes = adapter.getNodes();
    for (const node of nodes) {
      expect(node.measuredPorts).toBeUndefined();
    }
  });

  it('should strip measuredBounds from nodes', () => {
    const nodesWithComputed = createNodesWithComputedProperties();
    const adapter = TestBed.runInInjectionContext(() => initializeModel({ nodes: nodesWithComputed }));

    const nodes = adapter.getNodes();
    for (const node of nodes) {
      expect(node.measuredBounds).toBeUndefined();
    }
  });

  it('should strip computedZIndex from nodes', () => {
    const nodesWithComputed = createNodesWithComputedProperties();
    const adapter = TestBed.runInInjectionContext(() => initializeModel({ nodes: nodesWithComputed }));

    const nodes = adapter.getNodes();
    for (const node of nodes) {
      expect(node.computedZIndex).toBeUndefined();
    }
  });

  it('should strip sourcePosition from edges', () => {
    const edgesWithComputed = createEdgesWithComputedProperties();
    const adapter = TestBed.runInInjectionContext(() => initializeModel({ edges: edgesWithComputed }));

    const edges = adapter.getEdges();
    for (const edge of edges) {
      expect((edge as any).sourcePosition).toBeUndefined();
    }
  });

  it('should strip targetPosition from edges', () => {
    const edgesWithComputed = createEdgesWithComputedProperties();
    const adapter = TestBed.runInInjectionContext(() => initializeModel({ edges: edgesWithComputed }));

    const edges = adapter.getEdges();
    for (const edge of edges) {
      expect((edge as any).targetPosition).toBeUndefined();
    }
  });

  it('should strip measuredLabels from edges', () => {
    const edgesWithComputed = createEdgesWithComputedProperties();
    const adapter = TestBed.runInInjectionContext(() => initializeModel({ edges: edgesWithComputed }));

    const edges = adapter.getEdges();
    for (const edge of edges) {
      expect(edge.measuredLabels).toBeUndefined();
    }
  });

  it('should strip computedZIndex from edges', () => {
    const edgesWithComputed = createEdgesWithComputedProperties();
    const adapter = TestBed.runInInjectionContext(() => initializeModel({ edges: edgesWithComputed }));

    const edges = adapter.getEdges();
    for (const edge of edges) {
      expect(edge.computedZIndex).toBeUndefined();
    }
  });

  it('should preserve points on edges', () => {
    const edgesWithComputed = createEdgesWithComputedProperties();
    const adapter = TestBed.runInInjectionContext(() => initializeModel({ edges: edgesWithComputed }));

    const edges = adapter.getEdges();
    expect(edges[0].points).toEqual([
      { x: 10, y: 20 },
      { x: 200, y: 100 },
    ]);
  });

  it('should preserve user-set node properties', () => {
    const nodesWithComputed = createNodesWithComputedProperties();
    const adapter = TestBed.runInInjectionContext(() => initializeModel({ nodes: nodesWithComputed }));

    const nodes = adapter.getNodes();
    expect(nodes[0].position).toEqual({ x: 0, y: 0 });
    expect(nodes[0].data).toEqual({ label: 'Node 1' });
    expect(nodes[0].type).toBe('default');
    expect(nodes[1].position).toEqual({ x: 100, y: 50 });
  });

  it('should preserve user-set edge properties', () => {
    const edgesWithComputed = createEdgesWithComputedProperties();
    const adapter = TestBed.runInInjectionContext(() => initializeModel({ edges: edgesWithComputed }));

    const edges = adapter.getEdges();
    expect(edges[0].source).toBe('node1');
    expect(edges[0].target).toBe('node2');
  });

  it('should work with injector parameter', () => {
    const injector = TestBed.inject(Injector);
    const adapter = initializeModel({ nodes: mockNodes }, injector);

    expect(adapter.getNodes()).toHaveLength(2);
    expect((adapter.getNodes()[0] as any)._internalId).toMatch(INTERNAL_ID_PATTERN('node1'));
  });
});

describe('initializeModelAdapter', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SignalModelAdapter, EnvironmentProviderService],
    });
  });

  it('should return the same adapter instance', () => {
    const customAdapter = createMockModelAdapter(mockNodes, mockEdges);

    const result = TestBed.runInInjectionContext(() => initializeModelAdapter(customAdapter));

    expect(result).toBe(customAdapter);
  });

  it('should assign _internalId to adapter nodes', () => {
    const customAdapter = createMockModelAdapter(mockNodes, mockEdges);

    TestBed.runInInjectionContext(() => initializeModelAdapter(customAdapter));

    const nodes = customAdapter.getNodes();
    for (const node of nodes) {
      expect((node as any)._internalId).toBeDefined();
      expect((node as any)._internalId).toMatch(INTERNAL_ID_PATTERN(node.id));
    }
  });

  it('should assign _internalId to adapter edges', () => {
    const customAdapter = createMockModelAdapter(mockNodes, mockEdges);

    TestBed.runInInjectionContext(() => initializeModelAdapter(customAdapter));

    const edges = customAdapter.getEdges();
    for (const edge of edges) {
      expect((edge as any)._internalId).toBeDefined();
      expect((edge as any)._internalId).toMatch(INTERNAL_ID_PATTERN(edge.id));
    }
  });

  it('should strip selected from adapter nodes', () => {
    const nodesWithComputed = createNodesWithComputedProperties();
    const customAdapter = createMockModelAdapter(nodesWithComputed, mockEdges);

    TestBed.runInInjectionContext(() => initializeModelAdapter(customAdapter));

    const nodes = customAdapter.getNodes();
    for (const node of nodes) {
      expect(node.selected).toBeUndefined();
    }
  });

  it('should strip measuredPorts from adapter nodes', () => {
    const nodesWithComputed = createNodesWithComputedProperties();
    const customAdapter = createMockModelAdapter(nodesWithComputed, mockEdges);

    TestBed.runInInjectionContext(() => initializeModelAdapter(customAdapter));

    const nodes = customAdapter.getNodes();
    for (const node of nodes) {
      expect(node.measuredPorts).toBeUndefined();
    }
  });

  it('should strip measuredBounds from adapter nodes', () => {
    const nodesWithComputed = createNodesWithComputedProperties();
    const customAdapter = createMockModelAdapter(nodesWithComputed);

    TestBed.runInInjectionContext(() => initializeModelAdapter(customAdapter));

    const nodes = customAdapter.getNodes();
    for (const node of nodes) {
      expect(node.measuredBounds).toBeUndefined();
    }
  });

  it('should strip sourcePosition from adapter edges', () => {
    const edgesWithComputed = createEdgesWithComputedProperties();
    const customAdapter = createMockModelAdapter(mockNodes, edgesWithComputed);

    TestBed.runInInjectionContext(() => initializeModelAdapter(customAdapter));

    const edges = customAdapter.getEdges();
    for (const edge of edges) {
      expect((edge as any).sourcePosition).toBeUndefined();
    }
  });

  it('should strip targetPosition from adapter edges', () => {
    const edgesWithComputed = createEdgesWithComputedProperties();
    const customAdapter = createMockModelAdapter(mockNodes, edgesWithComputed);

    TestBed.runInInjectionContext(() => initializeModelAdapter(customAdapter));

    const edges = customAdapter.getEdges();
    for (const edge of edges) {
      expect((edge as any).targetPosition).toBeUndefined();
    }
  });

  it('should strip measuredLabels from adapter edges', () => {
    const edgesWithComputed = createEdgesWithComputedProperties();
    const customAdapter = createMockModelAdapter(mockNodes, edgesWithComputed);

    TestBed.runInInjectionContext(() => initializeModelAdapter(customAdapter));

    const edges = customAdapter.getEdges();
    for (const edge of edges) {
      expect(edge.measuredLabels).toBeUndefined();
    }
  });

  it('should strip computedZIndex from adapter nodes and edges', () => {
    const nodesWithComputed = createNodesWithComputedProperties();
    const edgesWithComputed = createEdgesWithComputedProperties();
    const customAdapter = createMockModelAdapter(nodesWithComputed, edgesWithComputed);

    TestBed.runInInjectionContext(() => initializeModelAdapter(customAdapter));

    for (const node of customAdapter.getNodes()) {
      expect(node.computedZIndex).toBeUndefined();
    }
    for (const edge of customAdapter.getEdges()) {
      expect(edge.computedZIndex).toBeUndefined();
    }
  });

  it('should preserve points on adapter edges', () => {
    const edgesWithComputed = createEdgesWithComputedProperties();
    const customAdapter = createMockModelAdapter(mockNodes, edgesWithComputed);

    TestBed.runInInjectionContext(() => initializeModelAdapter(customAdapter));

    const edges = customAdapter.getEdges();
    expect(edges[0].points).toEqual([
      { x: 10, y: 20 },
      { x: 200, y: 100 },
    ]);
  });

  it('should preserve user-set properties in adapter nodes', () => {
    const nodesWithComputed = createNodesWithComputedProperties();
    const customAdapter = createMockModelAdapter(nodesWithComputed, mockEdges);

    TestBed.runInInjectionContext(() => initializeModelAdapter(customAdapter));

    const nodes = customAdapter.getNodes();
    expect(nodes[0].id).toBe('node1');
    expect(nodes[0].position).toEqual({ x: 0, y: 0 });
    expect(nodes[0].data).toEqual({ label: 'Node 1' });
    expect(nodes[0].type).toBe('default');
  });

  it('should not modify adapter metadata', () => {
    const customAdapter = createMockModelAdapter(mockNodes, mockEdges);

    TestBed.runInInjectionContext(() => initializeModelAdapter(customAdapter));

    expect(customAdapter.getMetadata()).toEqual({ viewport: { x: 0, y: 0, scale: 1 } });
  });

  it('should handle adapter with empty data', () => {
    const customAdapter = createMockModelAdapter();

    TestBed.runInInjectionContext(() => initializeModelAdapter(customAdapter));

    expect(customAdapter.getNodes()).toEqual([]);
    expect(customAdapter.getEdges()).toEqual([]);
  });

  it('should generate fresh _internalId even if nodes already have one', () => {
    const nodesWithStaleId: Node[] = mockNodes.map((node) => ({
      ...node,
      _internalId: `${node.id}-stale-id`,
    })) as any;
    const customAdapter = createMockModelAdapter(nodesWithStaleId);

    TestBed.runInInjectionContext(() => initializeModelAdapter(customAdapter));

    const nodes = customAdapter.getNodes();
    for (const node of nodes) {
      const internalId = (node as any)._internalId;
      expect(internalId).not.toContain('stale-id');
      expect(internalId).toMatch(INTERNAL_ID_PATTERN(node.id));
    }
  });

  it('should work with injector parameter', () => {
    const customAdapter = createMockModelAdapter(mockNodes);
    const injector = TestBed.inject(Injector);

    const result = initializeModelAdapter(customAdapter, injector);

    expect(result).toBe(customAdapter);
    expect((customAdapter.getNodes()[0] as any)._internalId).toMatch(INTERNAL_ID_PATTERN('node1'));
  });
});
