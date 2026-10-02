import { type Size } from 'ng-diagram';

/** Template identifiers for node types used in the diagram. */
export enum NodeTemplateType {
  CollapsibleGroupNode = 'collapsibleGroupNode',
}

/**
 * Records which end of an edge was redirected to the group during collapse,
 * so that exactly this end can be restored on expand.
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
 * Data of a collapsible group node. Holds the collapse state and the
 * information needed to restore the group on expand.
 */
export interface CollapsibleGroupData {
  /** Display title rendered in the group header. */
  title: string;
  /** Whether the group is currently collapsed. */
  collapsed?: boolean;
  /**
   * Size of the group before it was collapsed,
   * used to restore the size on expand.
   */
  expandedSize?: Size;
  /**
   * Edges that were rerouted to point at the group
   * during collapse.
   */
  reroutedEdges?: ReroutedEdgeInfo[];
}
