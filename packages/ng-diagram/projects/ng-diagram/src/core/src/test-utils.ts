import { vi } from 'vitest';
import { FlowCore } from './flow-core';
import type { InputEventsRouter } from './input-events';
import type {
  Edge,
  EdgeLabel,
  EnvironmentInfo,
  GroupNode,
  Metadata,
  Middleware,
  ModelAdapter,
  Node,
  Port,
  Renderer,
} from './types';

export const mockNode: Node = {
  id: 'node1',
  type: 'node',
  selected: false,
  position: { x: 0, y: 0 },
  data: {},
};

export const mockGroupNode: GroupNode = {
  id: 'group1',
  type: 'group',
  selected: false,
  isGroup: true,
  position: { x: 0, y: 0 },
  data: {},
  zOrder: 1,
  highlighted: false,
};

export const mockEdge: Edge = {
  id: 'edge1',
  type: 'edge',
  source: '1',
  target: '2',
  selected: false,
  data: {},
  points: [
    { x: 0, y: 0 },
    { x: 100, y: 100 },
  ],
};

export const mockMetadata: Metadata = {
  viewport: { x: 0, y: 0, scale: 1 },
};

export const mockEnvironment: EnvironmentInfo = {
  os: 'MacOS',
  browser: 'Chrome',
  runtime: 'web',
  now: vi.fn(),
  generateId: vi.fn(),
};

export const mockPort: Port = {
  id: 'port1',
  type: 'both',
  side: 'left',
  position: { x: 0, y: 0 },
  size: { width: 10, height: 10 },
  nodeId: 'node1',
};

export const mockEdgeLabel: EdgeLabel = {
  id: 'label1',
  size: { width: 10, height: 10 },
  position: { x: 0, y: 0 },
  positionOnEdge: 0.5,
};

/** Yields one macrotask — lets fire-and-forget emits and transactions settle. */
export const macrotask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** In-memory ModelAdapter for integration tests — real reads/writes, spied lifecycle. */
export const createInMemoryModelAdapter = (): ModelAdapter => {
  let nodes: Node[] = [];
  let edges: Edge[] = [];
  let metadata: Metadata = { viewport: { x: 0, y: 0, scale: 1 } };

  return {
    getNodes: () => nodes,
    getEdges: () => edges,
    getMetadata: () => metadata,
    updateNodes: (updated: Node[] | ((nodes: Node[]) => Node[])) => {
      nodes = typeof updated === 'function' ? updated(nodes) : updated;
    },
    updateEdges: (updated: Edge[] | ((edges: Edge[]) => Edge[])) => {
      edges = typeof updated === 'function' ? updated(edges) : updated;
    },
    updateMetadata: (updated: Metadata | ((metadata: Metadata) => Metadata)) => {
      metadata = typeof updated === 'function' ? updated(metadata) : updated;
    },
    onChange: vi.fn(),
    unregisterOnChange: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    toJSON: vi.fn(),
    destroy: vi.fn(),
  };
};

/** Real FlowCore over an in-memory model — for tests that need the actual update pipeline. */
export const createTestFlowCore = (model: ModelAdapter, middlewares: Middleware[] = []): FlowCore => {
  const renderer: Renderer = { draw: vi.fn() };
  const inputEventsRouter = {
    emit: vi.fn(),
    register: vi.fn(),
    registerDefaultCallbacks: vi.fn(),
  } as unknown as InputEventsRouter;

  return new FlowCore(model, renderer, inputEventsRouter, mockEnvironment, middlewares);
};
