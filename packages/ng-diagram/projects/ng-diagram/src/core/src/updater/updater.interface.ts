import type { EdgeLabel, Node, Port } from '../types';

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
   * Apply port size and position updates
   */
  applyPortsSizesAndPositions(nodeId: string, ports: NonNullable<Pick<Port, 'id' | 'size' | 'position'>>[]): void;

  /**
   * Add an edge label
   */
  addEdgeLabel(edgeId: string, label: EdgeLabel): void;

  /**
   * Apply edge label size changes
   */
  applyEdgeLabelSize(edgeId: string, labelId: string, size: NonNullable<EdgeLabel['size']>): void;
}
