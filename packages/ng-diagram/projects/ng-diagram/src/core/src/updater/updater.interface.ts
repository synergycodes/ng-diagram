import type { EdgeLabel, Node, Port } from '../types';

export interface Updater {
  /**
   * Apply node size changes
   * @returns true if accepted, false if rejected
   */
  applyNodeSize(nodeId: string, size: NonNullable<Node['size']>): boolean;

  /**
   * Add a port to a node
   * @returns true if accepted, false if rejected
   */
  addPort(nodeId: string, port: Port): boolean;

  /**
   * Apply port size and position updates
   * @returns true if accepted, false if rejected
   */
  applyPortsSizesAndPositions(nodeId: string, ports: NonNullable<Pick<Port, 'id' | 'size' | 'position'>>[]): boolean;

  /**
   * Add an edge label
   * @returns true if accepted, false if rejected
   */
  addEdgeLabel(edgeId: string, label: EdgeLabel): boolean;

  /**
   * Apply edge label size changes
   * @returns true if accepted, false if rejected
   */
  applyEdgeLabelSize(edgeId: string, labelId: string, size: NonNullable<EdgeLabel['size']>): boolean;
}
