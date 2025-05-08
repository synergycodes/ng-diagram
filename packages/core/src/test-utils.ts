import { Edge } from './types/edge.interface';
import { PointerEvent } from './types/event.interface';
import { Metadata } from './types/metadata.interface';
import { Node } from './types/node.interface';

export const mockedNode: Node = {
  id: 'node1',
  type: 'node',
  selected: false,
  position: { x: 0, y: 0 },
  data: {},
};

export const mockedEdge: Edge = {
  id: 'edge1',
  type: 'edge',
  source: '1',
  target: '2',
  selected: false,
  data: {},
};

export const mockedPointerEvent: Omit<PointerEvent, 'type'> = {
  x: 0,
  y: 0,
  pressure: 0,
  timestamp: 0,
  target: { type: 'diagram' },
};

export const mockedMetadata: Metadata = {
  viewport: { x: 0, y: 0, scale: 1 },
};
