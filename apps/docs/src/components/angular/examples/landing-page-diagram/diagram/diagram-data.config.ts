/**
 * Diagram Data Configuration
 *
 * Contains all node and edge definitions for the diagram model.
 */
import type { Edge, Node } from 'ng-diagram';

/**
 * User data for the user panel node
 */
export const USERS = [
  { id: 1, name: 'Lena Wu', avatar: '👩', color: '#349A97' },
  { id: 2, name: 'Marcus Grant', avatar: '👨', color: '#292E78' },
  { id: 3, name: 'Nina Patel', avatar: '👩', color: '#FBAA03' },
  { id: 4, name: 'James Okoro', avatar: '👨', color: '#DD667C' },
  { id: 5, name: 'Sofia Lemaire', avatar: '👩', color: '#E7D9CE' },
] as const;

/**
 * All nodes in the diagram
 */
export const DIAGRAM_NODES: Node[] = [
  // Sub Process Group
  {
    id: 'sub-process',
    type: 'group',
    position: { x: 50, y: 80 },
    size: { width: 400, height: 400 },
    autoSize: false,
    data: { title: 'Sub Process' },
    isGroup: true,
  },

  // Nodes inside Sub Process
  {
    id: 'start-flow',
    type: 'workflow',
    position: { x: 120, y: 160 },
    groupId: 'sub-process',
    data: {
      title: 'Start Flow',
      subtitle: 'Trigger',
      icon: 'lightning',
      iconColor: '#4CAF50',
    },
  },
  {
    id: 'wait-interval',
    type: 'workflow',
    position: { x: 120, y: 260 },
    groupId: 'sub-process',
    data: {
      title: 'Wait Interval',
      subtitle: 'Delay',
      icon: 'timer',
      iconColor: '#FFC107',
    },
  },
  {
    id: 'send-notification',
    type: 'workflow',
    position: { x: 120, y: 360 },
    groupId: 'sub-process',
    data: {
      title: 'Send Notification',
      subtitle: 'Notification',
      icon: 'paper-plane-right',
      iconColor: '#2196F3',
    },
  },

  // Conditional Node
  {
    id: 'proceed-if-true',
    type: 'workflow',
    position: { x: 560, y: 280 },
    data: {
      title: 'Proceed if true',
      subtitle: 'Conditional',
      icon: 'list-checks',
      iconColor: '#4CAF50',
    },
  },

  // User Panel
  {
    id: 'user-panel',
    type: 'userPanel',
    position: { x: 190, y: 600 },
    data: { users: USERS },
  },

  // Graph Node
  {
    id: 'notify-users',
    type: 'graph',
    position: { x: 560, y: 475 },
    data: {
      title: 'Notify Users',
      subtitle: 'Action Node',
      icon: 'play-circle',
      iconColor: '#4CAF50',
    },
  },
];

/**
 * All edges in the diagram
 */
export const DIAGRAM_EDGES: Edge[] = [
  // Sub Process internal connections
  {
    id: 'e1',
    source: 'start-flow',
    sourcePort: 'port-right',
    target: 'wait-interval',
    targetPort: 'port-left',
    data: {},
  },
  {
    id: 'e2',
    source: 'wait-interval',
    sourcePort: 'port-right',
    target: 'send-notification',
    targetPort: 'port-left',
    data: {},
  },

  // Sub Process to Conditional
  {
    id: 'e3',
    source: 'sub-process',
    sourcePort: 'port-right',
    target: 'proceed-if-true',
    targetPort: 'port-left',
    data: {},
  },

  // Notify Users connections
  {
    id: 'e4',
    source: 'notify-users',
    sourcePort: 'port-left',
    target: 'send-notification',
    targetPort: 'port-right',
    data: {},
  },
  {
    id: 'e5',
    source: 'notify-users',
    sourcePort: 'port-left',
    target: 'user-panel',
    targetPort: 'port-right',
    data: {},
  },
];
