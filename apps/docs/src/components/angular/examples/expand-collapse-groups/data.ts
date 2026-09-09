import { type Edge, type GroupNode, type Node } from 'ng-diagram';
import { NodeTemplateType, type CollapsibleGroupData } from './types';

/**
 * Initial diagram model representing an org-chart-style hierarchy
 * with nested collapsible groups and cross-group edges.
 */
export const diagramModel: {
  nodes: (Node<{ label: string }> | GroupNode<CollapsibleGroupData>)[];
  edges: Edge[];
} = {
  nodes: [
    // ── Standalone node ──────────────────────────────────────────────
    {
      id: 'cto',
      position: { x: 700, y: 20 },
      data: { label: 'CTO' },
    },

    // ── Engineering (top-level group) ────────────────────────────────
    {
      id: 'engineering',
      position: { x: 50, y: 140 },
      size: { width: 1500, height: 780 },
      autoSize: false,
      data: { title: 'Engineering' },
      type: NodeTemplateType.CollapsibleGroupNode,
      isGroup: true,
      highlighted: false,
    },

    // ── Team Alpha (nested inside Engineering) ───────────────────────
    {
      id: 'team-alpha',
      position: { x: 100, y: 220 },
      size: { width: 580, height: 470 },
      autoSize: false,
      data: { title: 'Team Alpha' },
      type: NodeTemplateType.CollapsibleGroupNode,
      isGroup: true,
      highlighted: false,
      groupId: 'engineering',
    },

    // ── Frontend Squad (nested inside Team Alpha — 3 levels deep) ────
    {
      id: 'frontend-squad',
      position: { x: 135, y: 300 },
      size: { width: 510, height: 170 },
      autoSize: false,
      data: { title: 'Frontend Squad' },
      type: NodeTemplateType.CollapsibleGroupNode,
      isGroup: true,
      highlighted: false,
      groupId: 'team-alpha',
    },
    {
      id: 'alice',
      position: { x: 170, y: 365 },
      data: { label: 'Alice' },
      groupId: 'frontend-squad',
    },
    {
      id: 'bob',
      position: { x: 420, y: 365 },
      data: { label: 'Bob' },
      groupId: 'frontend-squad',
    },

    // Direct children of Team Alpha (alongside Frontend Squad)
    {
      id: 'charlie',
      position: { x: 170, y: 560 },
      data: { label: 'Charlie' },
      groupId: 'team-alpha',
    },
    {
      id: 'diana',
      position: { x: 420, y: 560 },
      data: { label: 'Diana' },
      groupId: 'team-alpha',
    },

    // ── Team Beta (nested inside Engineering) ────────────────────────
    {
      id: 'team-beta',
      position: { x: 860, y: 220 },
      size: { width: 580, height: 400 },
      autoSize: false,
      data: { title: 'Team Beta' },
      type: NodeTemplateType.CollapsibleGroupNode,
      isGroup: true,
      highlighted: false,
      groupId: 'engineering',
    },
    {
      id: 'dave',
      position: { x: 900, y: 300 },
      data: { label: 'Dave' },
      groupId: 'team-beta',
    },
    {
      id: 'eve',
      position: { x: 1190, y: 300 },
      data: { label: 'Eve' },
      groupId: 'team-beta',
    },
    {
      id: 'frank',
      position: { x: 1040, y: 470 },
      data: { label: 'Frank' },
      groupId: 'team-beta',
    },

    // Direct child of Engineering (alongside the team groups)
    {
      id: 'tech-lead',
      position: { x: 700, y: 790 },
      data: { label: 'Tech Lead' },
      groupId: 'engineering',
    },
  ],
  // Edges never need visibility handling: an edge is effectively hidden
  // whenever one of its endpoint nodes is hidden.
  edges: [
    // Internal edge within Frontend Squad
    { id: 'e-alice-bob', source: 'alice', target: 'bob', data: {} },

    // Internal edges within Team Alpha
    { id: 'e-charlie-diana', source: 'charlie', target: 'diana', data: {} },
    { id: 'e-bob-charlie', source: 'bob', target: 'charlie', data: {} },

    // Internal edges within Team Beta
    { id: 'e-dave-eve', source: 'dave', target: 'eve', data: {} },
    { id: 'e-dave-frank', source: 'dave', target: 'frank', data: {} },

    // Cross-group edge (Team Alpha child → Team Beta child)
    { id: 'e-diana-dave', source: 'diana', target: 'dave', data: {} },

    // Engineering internal (child → Tech Lead)
    {
      id: 'e-charlie-techlead',
      source: 'charlie',
      target: 'tech-lead',
      data: {},
    },
    { id: 'e-frank-techlead', source: 'frank', target: 'tech-lead', data: {} },

    // External edges (crossing the Engineering boundary)
    { id: 'e-cto-techlead', source: 'cto', target: 'tech-lead', data: {} },
    { id: 'e-eve-cto', source: 'eve', target: 'cto', data: {} },
  ],
};
