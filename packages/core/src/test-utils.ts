import type { Edge, EdgeLabel, EnvironmentInfo, Metadata, MiddlewaresConfigFromMiddlewares, Node, Port } from './types';

export const mockNode: Node = {
  id: 'node1',
  type: 'node',
  selected: false,
  position: { x: 0, y: 0 },
  data: {},
};

export const mockGroupNode: Node = {
  id: 'group1',
  type: 'group',
  selected: false,
  isGroup: true,
  position: { x: 0, y: 0 },
  data: {},
  zOrder: 1,
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

export const mockMetadata: Metadata<MiddlewaresConfigFromMiddlewares<[]>> = {
  viewport: { x: 0, y: 0, scale: 1 },
  middlewaresConfig: {
    'node-position-snap': { snap: { x: 10, y: 10 } },
    'node-rotation-snap': { enabled: true, snap: 10 },
    'group-children-change-extent': { enabled: true },
    'group-children-move-extent': { enabled: true },
    'edges-routing': { enabled: true },
  },
};

export const mockEnvironment: EnvironmentInfo = {
  os: 'MacOS',
  browser: 'Chrome',
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
