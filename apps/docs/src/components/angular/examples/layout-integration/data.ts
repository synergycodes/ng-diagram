import { type Edge, type Node } from 'ng-diagram';
import { NodeTemplateType } from './types';

export const diagramModel: { nodes: Node[]; edges: Edge[] } = {
  nodes: [
    {
      id: '1',
      position: { x: 0, y: 0 },
      data: { label: 'Root' },
      type: NodeTemplateType.CustomNodeType,
    },
    {
      id: '2',
      position: { x: 567, y: 122 },
      data: { label: 'B' },
      type: NodeTemplateType.CustomNodeType,
    },
    {
      id: '3',
      position: { x: 320, y: 301 },
      data: { label: 'A' },
      type: NodeTemplateType.CustomNodeType,
    },
    {
      id: '4',
      position: { x: 611, y: 487 },
      data: { label: 'B 2' },
      type: NodeTemplateType.CustomNodeType,
    },
    {
      id: '5',
      position: { x: 97, y: 178 },
      data: { label: 'A 1' },
      type: NodeTemplateType.CustomNodeType,
    },
    {
      id: '6',
      position: { x: 235, y: 85 },
      data: { label: 'A 2' },
      type: NodeTemplateType.CustomNodeType,
    },
    {
      id: '7',
      position: { x: 528, y: 320 },
      data: { label: 'B 2' },
      type: NodeTemplateType.CustomNodeType,
    },
    {
      id: '8',
      position: { x: 165, y: 387 },
      data: { label: 'A 1.1' },
      type: NodeTemplateType.CustomNodeType,
    },
  ],
  edges: [
    {
      id: 'e1-2',
      source: '1',
      sourcePort: 'port-right',
      targetPort: 'port-left',
      target: '2',
      data: {},
    },
    {
      id: 'e1-3',
      source: '1',
      sourcePort: 'port-bottom',
      targetPort: 'port-left',
      target: '3',
      data: {},
    },
    {
      id: 'e2-4',
      source: '2',
      sourcePort: 'port-right',
      targetPort: 'port-left',
      target: '4',
      data: {},
    },
    {
      id: 'e3-5',
      source: '3',
      sourcePort: 'port-bottom',
      targetPort: 'port-left',
      target: '5',
      data: {},
    },
    {
      id: 'e3-6',
      source: '3',
      sourcePort: 'port-right',
      targetPort: 'port-left',
      target: '6',
      data: {},
    },
    {
      id: 'e4-7',
      source: '4',
      sourcePort: 'port-right',
      targetPort: 'port-left',
      target: '7',
      data: {},
    },
    {
      id: 'e5-8',
      source: '5',
      sourcePort: 'port-right',
      targetPort: 'port-left',
      target: '8',
      data: {},
    },
  ],
};
