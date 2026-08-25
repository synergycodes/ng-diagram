import type { Edge, Node } from 'ng-diagram';

export const COLLAPSIBLE_GROUP_ID = 'he-group';
export const FAR_NODE_ID = 'he-far';

/**
 * Model for the hidden-elements demo: a group whose children carry
 * `hidden: true` from the start (the group is "collapsed"), edges between
 * the children and to outside nodes, and a node whose ports are hidden
 * declaratively via the `[hidden]` port input.
 *
 * The hidden children stay mounted as `display: none` and do not block
 * initialization — no 2s measurement-timeout warning despite never being
 * visible. Edges touching a hidden endpoint hide automatically.
 */
export function createHiddenElementsModel(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    {
      id: COLLAPSIBLE_GROUP_ID,
      type: 'custom-group',
      isGroup: true,
      position: { x: 300, y: 100 },
      size: { width: 420, height: 280 },
      autoSize: false,
      data: { title: 'Collapsible group' },
    },
    {
      id: 'he-child-1',
      groupId: COLLAPSIBLE_GROUP_ID,
      hidden: true,
      position: { x: 330, y: 180 },
      data: { label: 'Child 1' },
    },
    {
      id: 'he-child-2',
      groupId: COLLAPSIBLE_GROUP_ID,
      hidden: true,
      position: { x: 540, y: 180 },
      data: { label: 'Child 2' },
    },
    {
      id: 'he-child-3',
      groupId: COLLAPSIBLE_GROUP_ID,
      hidden: true,
      position: { x: 430, y: 300 },
      data: { label: 'Child 3' },
    },
    {
      id: 'he-outside',
      position: { x: 850, y: 180 },
      data: { label: 'Outside node' },
    },
    {
      id: 'he-port-node',
      type: 'hidden-port',
      position: { x: 850, y: 400 },
      data: { text: 'Declarative port [hidden]' },
    },
    // Far away on purpose: hiding it visibly shrinks the zoomToFit frame —
    // hidden geometry must not inflate the bounds.
    {
      id: FAR_NODE_ID,
      position: { x: 1700, y: 750 },
      data: { label: 'Far node (bounds)' },
    },
  ];

  const edges: Edge[] = [
    // Edges inside the group — hidden while the children are hidden.
    {
      id: 'he-edge-1',
      source: 'he-child-1',
      target: 'he-child-2',
      sourcePort: 'port-right',
      targetPort: 'port-left',
      data: {},
    },
    {
      id: 'he-edge-2',
      source: 'he-child-2',
      target: 'he-child-3',
      sourcePort: 'port-right',
      targetPort: 'port-left',
      data: {},
    },
    // Crosses the group boundary — hides automatically because its source is hidden.
    {
      id: 'he-edge-3',
      source: 'he-child-2',
      target: 'he-outside',
      sourcePort: 'port-right',
      targetPort: 'port-left',
      data: {},
    },
    // Anchored to ports that can be hidden via the `[hidden]` port input.
    {
      id: 'he-edge-4',
      source: 'he-outside',
      target: 'he-port-node',
      sourcePort: 'port-right',
      targetPort: 'port-left',
      data: {},
    },
    // Long edge to the far node — hides (and leaves the bounds) with it.
    {
      id: 'he-edge-5',
      source: 'he-port-node',
      target: FAR_NODE_ID,
      sourcePort: 'port-right',
      targetPort: 'port-left',
      data: {},
    },
  ];

  return { nodes, edges };
}
