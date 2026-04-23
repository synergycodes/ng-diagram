import type { EdgeLabel, Node, Port } from '../types';
import type { PortUpdate } from '../port-batch-processor/port-batch-processor';
import type { LabelUpdate } from '../label-batch-processor/label-batch-processor';

export interface Updater {
  /**
   * Apply node size changes
   */
  applyNodeSize(nodeId: string, size: NonNullable<Node['size']>): void;

  /**
   * Add a port to a node
   */
  addPort(nodeId: string, port: Port): void;

  /**
   * Apply port changes (size, position, side, type, etc.)
   */
  applyPortChanges(nodeId: string, portUpdates: PortUpdate[]): void;

  /**
   * Add an edge label
   */
  addEdgeLabel(edgeId: string, label: EdgeLabel): void;

  /**
   * Apply edge label changes (size, positionOnEdge, etc.)
   */
  applyEdgeLabelChanges(edgeId: string, labelUpdates: LabelUpdate[]): void;

  /**
   * Delete an edge label
   */
  deleteEdgeLabel(edgeId: string, labelId: string): void;
}
