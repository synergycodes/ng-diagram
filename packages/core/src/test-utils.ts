import type {
  Edge,
  EdgeLabel,
  EnvironmentInfo,
  KeyboardEvent,
  Metadata,
  Node,
  PointerEvent,
  Port,
  RotateEvent,
  WheelEvent,
} from './types';

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
  points: [
    { x: 0, y: 0 },
    { x: 100, y: 100 },
  ],
};

export const mockPointerEvent: Omit<PointerEvent, 'type'> = {
  pointerId: 0,
  x: 0,
  y: 0,
  pressure: 0,
  timestamp: 0,
  target: { type: 'diagram' },
  ctrlKey: false,
  metaKey: false,
};

export function getSampleWheelEvent(overrides: Partial<WheelEvent> = {}): WheelEvent {
  return {
    type: 'wheel',
    target: { type: 'diagram' },
    timestamp: 1,
    x: 0,
    y: 0,
    deltaX: 0,
    deltaY: 0,
    deltaZ: 0,
    ...overrides,
  };
}

export function getSamplePointerEvent(overrides: Partial<PointerEvent> = {}): PointerEvent {
  return {
    type: 'pointerdown',
    pointerId: 0,
    timestamp: 1,
    target: { type: 'diagram' },
    x: 0,
    y: 0,
    pressure: 0,
    button: 0,
    ctrlKey: false,
    metaKey: false,
    ...overrides,
  };
}

export function getSampleKeyboardEvent(overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    type: 'keydown',
    timestamp: 1,
    target: { type: 'diagram' },
    key: 'a',
    code: 'KeyA',
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    ...overrides,
  };
}

export const getSampleRotateEvent = (overrides: Partial<RotateEvent> = {}): RotateEvent => {
  return {
    type: 'rotate',
    timestamp: 1,
    target: { type: 'rotate-handle', element: mockNode },
    mouse: { x: 0, y: 0 },
    handle: { x: 0, y: 0 },
    center: { x: 0, y: 0 },
    ports: [],
    ...overrides,
  };
};

export const mockMetadata: Metadata = {
  viewport: { x: 0, y: 0, scale: 1 },
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
