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

/** A group, a member inside it, and a free node — for group/selection scenarios. */
export const groupArena: Partial<Model> = {
  nodes: [
    { id: 'grp-1', position: { x: 100, y: 100 }, data: { label: 'group' }, isGroup: true },
    { id: 'member-1', position: { x: 140, y: 150 }, data: { label: 'member' }, groupId: 'grp-1' },
    { id: 'free-1', position: { x: 460, y: 120 }, data: { label: 'free' } },
  ],
  edges: [],
};
