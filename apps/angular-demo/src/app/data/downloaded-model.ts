import { type DiagramModel } from './default-model';

export const downloadedModel: DiagramModel = {
  nodes: [
    { id: 'dl-1', position: { x: 100, y: 100 }, data: { label: 'Downloaded Node A' } },
    { id: 'dl-2', position: { x: 400, y: 100 }, data: { label: 'Downloaded Node B' } },
    { id: 'dl-3', position: { x: 250, y: 300 }, data: { label: 'Downloaded Node C' } },
  ],
  edges: [
    { id: 'dl-e1', source: 'dl-1', target: 'dl-2', data: {} },
    { id: 'dl-e2', source: 'dl-1', target: 'dl-3', data: {} },
    { id: 'dl-e3', source: 'dl-2', target: 'dl-3', data: {} },
  ],
};
