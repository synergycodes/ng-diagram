import type { Model } from 'ng-diagram';

/**
 * Deterministic seed model used by the e2e harness. Tests can override it via
 * `window.__ngDiagramSeed__` before navigation; otherwise this is rendered.
 *
 * Keep IDs stable — tests reference them directly.
 */
export const DEFAULT_E2E_MODEL: Partial<Model> = {
  nodes: [
    {
      id: 'node-a',
      position: { x: 80, y: 80 },
      data: { label: 'A' },
    },
    {
      id: 'node-b',
      position: { x: 320, y: 80 },
      data: { label: 'B' },
    },
    {
      id: 'node-c',
      position: { x: 200, y: 260 },
      data: { label: 'C' },
    },
  ],
  edges: [
    {
      id: 'edge-ab',
      source: 'node-a',
      target: 'node-b',
      data: {},
    },
  ],
};
