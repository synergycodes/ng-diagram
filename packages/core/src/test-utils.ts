import type { Edge, EnvironmentInfo, Metadata, Node, PointerEvent } from './types';

export const mockNode: Node = {
  id: 'node1',
  type: 'node',
  selected: false,
  position: { x: 0, y: 0 },
  data: {},
};

export const mockEdge: Edge = {
  id: 'edge1',
  type: 'edge',
  source: '1',
  target: '2',
  selected: false,
  data: {},
};

export const mockPointerEvent: Omit<PointerEvent, 'type'> = {
  x: 0,
  y: 0,
  pressure: 0,
  timestamp: 0,
  target: { type: 'diagram' },
};

export const mockMetadata: Metadata = {
  viewport: { x: 0, y: 0, scale: 1 },
};

export const mockEnvironment: EnvironmentInfo = {
  os: 'MacOS',
  browser: 'Chrome',
};
