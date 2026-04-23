import type { Port } from '../../types';
import type { PortUpdate } from '../../port-batch-processor/port-batch-processor';

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
   * Update port properties (size, position, side, type, etc.)
   */
  updatePorts(nodeId: string, portUpdates: PortUpdate[]): void;

  /**
   * Delete a port from a node
   */
  deletePort(nodeId: string, portId: string): void;
}
