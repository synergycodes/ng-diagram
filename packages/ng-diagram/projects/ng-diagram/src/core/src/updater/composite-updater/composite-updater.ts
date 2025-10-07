import type { EdgeLabel, Node, Port } from '../../types';
import { InitUpdater } from '../init-updater/init-updater';
import { InternalUpdater } from '../internal-updater/internal-updater';
import { Updater } from '../updater.interface';

/**
 * CompositeUpdater routes calls to either InitUpdater or InternalUpdater
 * based on whether the relevant initializer has finished.
 * This ensures that once an initializer completes, subsequent calls
 * go directly to InternalUpdater, even if other initializers are still running.
 *
 * If InitUpdater rejects the data (returns false), CompositeUpdater automatically
 * retries with InternalUpdater to ensure no data is lost.
 */
export class CompositeUpdater implements Updater {
  constructor(
    private readonly initUpdater: InitUpdater,
    private readonly internalUpdater: InternalUpdater
  ) {}

  /**
   * Apply node size changes
   * Routes to InitUpdater if node size initializer is not finished, otherwise to InternalUpdater.
   * If InitUpdater rejects, automatically retries with InternalUpdater.
   */
  applyNodeSize(nodeId: string, size: NonNullable<Node['size']>): boolean {
    if (this.initUpdater.isNodeSizeInitializerFinished()) {
      return this.internalUpdater.applyNodeSize(nodeId, size);
    }

    const accepted = this.initUpdater.applyNodeSize(nodeId, size);
    if (!accepted) {
      // InitUpdater finished after we checked, retry with InternalUpdater
      return this.internalUpdater.applyNodeSize(nodeId, size);
    }
    return true;
  }

  /**
   * Add a port to a node
   * Routes to InitUpdater if port initializer is not finished, otherwise to InternalUpdater.
   * If InitUpdater rejects, automatically retries with InternalUpdater.
   */
  addPort(nodeId: string, port: Port): boolean {
    if (this.initUpdater.isPortInitializerFinished()) {
      return this.internalUpdater.addPort(nodeId, port);
    }

    const accepted = this.initUpdater.addPort(nodeId, port);
    if (!accepted) {
      // InitUpdater finished after we checked, retry with InternalUpdater
      return this.internalUpdater.addPort(nodeId, port);
    }
    return true;
  }

  /**
   * Apply port size and position updates
   * Routes to InitUpdater if port rect initializer is not finished, otherwise to InternalUpdater.
   * If InitUpdater rejects, automatically retries with InternalUpdater.
   */
  applyPortsSizesAndPositions(nodeId: string, ports: NonNullable<Pick<Port, 'id' | 'size' | 'position'>>[]): boolean {
    if (this.initUpdater.isPortRectInitializerFinished()) {
      return this.internalUpdater.applyPortsSizesAndPositions(nodeId, ports);
    }

    const accepted = this.initUpdater.applyPortsSizesAndPositions(nodeId, ports);
    if (!accepted) {
      // InitUpdater finished after we checked, retry with InternalUpdater
      return this.internalUpdater.applyPortsSizesAndPositions(nodeId, ports);
    }
    return true;
  }

  /**
   * Add an edge label
   * Routes to InitUpdater if edge label initializer is not finished, otherwise to InternalUpdater.
   * If InitUpdater rejects, automatically retries with InternalUpdater.
   */
  addEdgeLabel(edgeId: string, label: EdgeLabel): boolean {
    if (this.initUpdater.isEdgeLabelInitializerFinished()) {
      return this.internalUpdater.addEdgeLabel(edgeId, label);
    }

    const accepted = this.initUpdater.addEdgeLabel(edgeId, label);
    if (!accepted) {
      // InitUpdater finished after we checked, retry with InternalUpdater
      return this.internalUpdater.addEdgeLabel(edgeId, label);
    }
    return true;
  }

  /**
   * Apply edge label size changes
   * Routes to InitUpdater if edge label size initializer is not finished, otherwise to InternalUpdater.
   * If InitUpdater rejects, automatically retries with InternalUpdater.
   */
  applyEdgeLabelSize(edgeId: string, labelId: string, size: NonNullable<EdgeLabel['size']>): boolean {
    if (this.initUpdater.isEdgeLabelSizeInitializerFinished()) {
      return this.internalUpdater.applyEdgeLabelSize(edgeId, labelId, size);
    }

    const accepted = this.initUpdater.applyEdgeLabelSize(edgeId, labelId, size);
    if (!accepted) {
      // InitUpdater finished after we checked, retry with InternalUpdater
      return this.internalUpdater.applyEdgeLabelSize(edgeId, labelId, size);
    }
    return true;
  }
}
