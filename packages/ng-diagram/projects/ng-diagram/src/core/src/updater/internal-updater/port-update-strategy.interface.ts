import type { Port } from '../../types';

/**
 * Strategy interface for port update operations.
 * Abstracts the differences between direct and virtualized rendering modes.
 */
export interface PortUpdateStrategy {
  /**
   * Add a port to a node
   */
  addPort(nodeId: string, port: Port): void;

  /**
   * Delete a port from a node.
   * Optional because virtualization mode doesn't delete ports on DOM unmount -
   * ports persist in the model and are restored when the node scrolls back into view.
   */
  deletePort?(nodeId: string, portId: string): void;

  /**
   * Update port sizes and positions
   */
  updatePorts(nodeId: string, ports: Pick<Port, 'id' | 'size' | 'position'>[]): void;
}
