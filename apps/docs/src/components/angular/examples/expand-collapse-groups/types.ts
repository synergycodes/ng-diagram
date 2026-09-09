import { type Size } from 'ng-diagram';

/** Template identifiers for node types used in the diagram. */
export enum NodeTemplateType {
  SimpleNode = 'simpleNode',
  CollapsibleGroupNode = 'collapsibleGroupNode',
}

/** Data payload for simple (non-group) nodes. */
export interface SimpleNodeData {
  /** Display label rendered inside the node. */
  label: string;
}

/**
 * Records which endpoint of an edge was redirected to the group boundary
 * during collapse, so exactly that endpoint can be restored on expand.
 */
export interface ReroutedEdgeInfo {
  /** ID of the rerouted edge. */
  edgeId: string;
  /** The endpoint that was redirected to the group. */
  endpoint: 'source' | 'target';
  /** Node the endpoint pointed at before the reroute. */
  originalNodeId: string;
  /** Port the endpoint used before the reroute, if any. */
  originalPortId?: string;
}

/**
 * Data payload for collapsible group nodes. Tracks collapse state
 * and information needed to restore the group on expand.
 */
export interface CollapsibleGroupData {
  /** Display title rendered in the group header. */
  title: string;
  /** Whether the group is currently collapsed. */
  collapsed?: boolean;
  /**
   * Size of the group before it was collapsed,
   * used to restore dimensions on expand.
   */
  expandedSize?: Size;
  /**
   * Edges that were rerouted to point at the group boundary
   * during collapse.
   */
  reroutedEdges?: ReroutedEdgeInfo[];
}
