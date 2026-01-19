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
   * Update port sizes and positions
   */
  updatePorts(nodeId: string, ports: Pick<Port, 'id' | 'size' | 'position'>[]): void;

  /**
   * Delete a port from a node
   */
  deletePort(nodeId: string, portId: string): void;
}
