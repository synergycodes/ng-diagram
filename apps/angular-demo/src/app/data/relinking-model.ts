import type { Edge, Node } from 'ng-diagram';

/** Data carried by the scene edges — the label chip plus the flags the config rules read. */
export interface RelinkingEdgeData {
  label?: string;
  /** Read by the "by edge data" `shouldKeepOnDrop` rule. */
  keepOnDrop?: boolean;
  /** Read by the "by edge data" `shouldDetachOnNodeDelete` rule. */
  deleteWithNode?: boolean;
}

export const RL_EDGE_DEFAULT = 'rl-edge-default';
export const RL_EDGE_TRUE = 'rl-edge-true';
export const RL_EDGE_SOURCE_ONLY = 'rl-edge-source-only';
export const RL_EDGE_TARGET_ONLY = 'rl-edge-target-only';
export const RL_EDGE_LOCKED = 'rl-edge-locked';
export const RL_EDGE_DANGLING_SOURCE = 'rl-edge-dangling-source';
export const RL_EDGE_DUAL_DANGLING = 'rl-edge-dual-dangling';
export const RL_EDGE_IN_GROUP = 'rl-edge-in-group';
export const RL_EDGE_KEEP_ON_DROP = 'rl-edge-keep-on-drop';
export const RL_EDGE_DELETE_WITH_NODE = 'rl-edge-delete-with-node';

export const RL_GROUP_ID = 'rl-group';
export const RL_DROP_TARGET_1 = 'rl-drop-1';
export const RL_DROP_TARGET_2 = 'rl-drop-2';

/** Vertical distance between two consecutive scene rows. */
const ROW_PITCH = 110;

/** Left column (sources) and right column (targets) of the row grid. */
const SOURCE_X = 0;
const TARGET_X = 350;

const rowY = (row: number) => 40 + row * ROW_PITCH;

/**
 * Model for the relinking & dangling test mode. Every row demonstrates one
 * rule of the relinking surface: the `relinkable` variants, edges that start
 * dangling at one or both ends, a group whose members exercise the
 * "same group only" validation, and two edges whose `data` flags drive the
 * `shouldKeepOnDrop` / `shouldDetachOnNodeDelete` config callbacks.
 *
 * The two nodes on the far right are free drop targets — their ports are
 * unused, so a dragged endpoint handle always has somewhere valid to land.
 */
export function createRelinkingModel(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    { id: 'rl-a1', position: { x: SOURCE_X, y: rowY(0) }, data: { label: 'A1' } },
    { id: 'rl-b1', position: { x: TARGET_X, y: rowY(0) }, data: { label: 'B1' } },
    { id: 'rl-a2', position: { x: SOURCE_X, y: rowY(1) }, data: { label: 'A2' } },
    { id: 'rl-b2', position: { x: TARGET_X, y: rowY(1) }, data: { label: 'B2' } },
    { id: 'rl-a3', position: { x: SOURCE_X, y: rowY(2) }, data: { label: 'A3' } },
    { id: 'rl-b3', position: { x: TARGET_X, y: rowY(2) }, data: { label: 'B3' } },
    { id: 'rl-a4', position: { x: SOURCE_X, y: rowY(3) }, data: { label: 'A4' } },
    { id: 'rl-b4', position: { x: TARGET_X, y: rowY(3) }, data: { label: 'B4' } },
    { id: 'rl-a5', position: { x: SOURCE_X, y: rowY(4) }, data: { label: 'A5' } },
    { id: 'rl-b5', position: { x: TARGET_X, y: rowY(4) }, data: { label: 'B5' } },
    // Row 6 has no source node — the edge below starts free at the source end.
    { id: 'rl-b6', position: { x: TARGET_X, y: rowY(5) }, data: { label: 'B6' } },
    // Row 7 is a dual dangling edge, so it needs no node at all.
    {
      id: RL_GROUP_ID,
      type: 'custom-group',
      isGroup: true,
      position: { x: SOURCE_X, y: rowY(7) },
      size: { width: 640, height: 200 },
      autoSize: false,
      data: { title: 'Group (same-group rule)' },
    },
    {
      id: 'rl-g1',
      groupId: RL_GROUP_ID,
      position: { x: SOURCE_X + 30, y: rowY(7) + 70 },
      data: { label: 'G1' },
    },
    {
      id: 'rl-g2',
      groupId: RL_GROUP_ID,
      position: { x: SOURCE_X + 400, y: rowY(7) + 70 },
      data: { label: 'G2' },
    },
    // Outside the group: relinking a group edge onto this node is refused by
    // the "relink only inside the same group" validation rule.
    { id: 'rl-outside', position: { x: 720, y: rowY(7) + 70 }, data: { label: 'Outside' } },
    { id: 'rl-a9', position: { x: SOURCE_X, y: rowY(9) + 30 }, data: { label: 'A9' } },
    { id: 'rl-b9', position: { x: TARGET_X, y: rowY(9) + 30 }, data: { label: 'B9' } },
    { id: 'rl-a10', position: { x: SOURCE_X, y: rowY(10) + 30 }, data: { label: 'A10' } },
    { id: 'rl-b10', position: { x: TARGET_X, y: rowY(10) + 30 }, data: { label: 'B10' } },
    { id: RL_DROP_TARGET_1, position: { x: 800, y: rowY(1) }, data: { label: 'Drop target 1' } },
    { id: RL_DROP_TARGET_2, position: { x: 800, y: rowY(3) }, data: { label: 'Drop target 2' } },
  ];

  const edges: Edge<RelinkingEdgeData>[] = [
    {
      id: RL_EDGE_DEFAULT,
      source: 'rl-a1',
      sourcePort: 'port-right',
      target: 'rl-b1',
      targetPort: 'port-left',
      data: { label: 'default from config' },
    },
    {
      id: RL_EDGE_TRUE,
      source: 'rl-a2',
      sourcePort: 'port-right',
      target: 'rl-b2',
      targetPort: 'port-left',
      relinkable: true,
      data: { label: 'relinkable: true' },
    },
    {
      id: RL_EDGE_SOURCE_ONLY,
      source: 'rl-a3',
      sourcePort: 'port-right',
      target: 'rl-b3',
      targetPort: 'port-left',
      relinkable: 'source',
      data: { label: "relinkable: 'source'" },
    },
    {
      id: RL_EDGE_TARGET_ONLY,
      source: 'rl-a4',
      sourcePort: 'port-right',
      target: 'rl-b4',
      targetPort: 'port-left',
      relinkable: 'target',
      data: { label: "relinkable: 'target'" },
    },
    {
      id: RL_EDGE_LOCKED,
      source: 'rl-a5',
      sourcePort: 'port-right',
      target: 'rl-b5',
      targetPort: 'port-left',
      relinkable: false,
      data: { label: 'locked' },
    },
    // Free at the source from the first render: empty `source` plus a
    // `sourcePosition` anchor and no `sourcePort`.
    {
      id: RL_EDGE_DANGLING_SOURCE,
      source: '',
      sourcePosition: { x: SOURCE_X + 60, y: rowY(5) + 25 },
      target: 'rl-b6',
      targetPort: 'port-left',
      data: { label: 'dangling source' },
    },
    {
      id: RL_EDGE_DUAL_DANGLING,
      source: '',
      sourcePosition: { x: SOURCE_X + 60, y: rowY(6) + 25 },
      target: '',
      targetPosition: { x: TARGET_X + 60, y: rowY(6) + 25 },
      data: { label: 'dual dangling' },
    },
    {
      id: RL_EDGE_IN_GROUP,
      source: 'rl-g1',
      sourcePort: 'port-right',
      target: 'rl-g2',
      targetPort: 'port-left',
      data: { label: 'inside the group' },
    },
    {
      id: RL_EDGE_KEEP_ON_DROP,
      source: 'rl-a9',
      sourcePort: 'port-right',
      target: 'rl-b9',
      targetPort: 'port-left',
      data: { label: 'keepOnDrop: false', keepOnDrop: false },
    },
    {
      id: RL_EDGE_DELETE_WITH_NODE,
      source: 'rl-a10',
      sourcePort: 'port-right',
      target: 'rl-b10',
      targetPort: 'port-left',
      data: { label: 'deleteWithNode: true', deleteWithNode: true },
    },
  ];

  return { nodes, edges };
}
