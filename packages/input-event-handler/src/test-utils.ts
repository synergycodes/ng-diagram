import { Edge, Node, PointerEvent } from '@angularflow/core';

export const mockedNode: Node = {
  id: '1',
  type: 'node',
  selected: false,
  position: { x: 0, y: 0 },
};

export const mockedEdge: Edge = {
  id: '1',
  type: 'edge',
  source: '1',
  target: '2',
  selected: false,
};

export const mockedPointerEvent: Omit<PointerEvent, 'type'> = {
  target: null,
  x: 0,
  y: 0,
  pressure: 0,
  timestamp: 0,
};
