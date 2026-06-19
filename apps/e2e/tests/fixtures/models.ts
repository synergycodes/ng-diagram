import type { Model } from 'ng-diagram';

export const trio: Partial<Model> = {
  nodes: [
    { id: 'node-a', position: { x: 80, y: 80 }, data: { label: 'A' } },
    { id: 'node-b', position: { x: 320, y: 80 }, data: { label: 'B' } },
    { id: 'node-c', position: { x: 200, y: 260 }, data: { label: 'C' } },
  ],
  edges: [{ id: 'edge-ab', source: 'node-a', target: 'node-b', data: {} }],
};

export const pair: Partial<Model> = {
  nodes: [
    { id: 'node-a', position: { x: 80, y: 120 }, data: { label: 'A' } },
    { id: 'node-b', position: { x: 360, y: 120 }, data: { label: 'B' } },
  ],
  edges: [],
};

export const solo: Partial<Model> = {
  nodes: [{ id: 'solo', position: { x: 100, y: 100 }, data: { label: 'solo' } }],
  edges: [],
};
