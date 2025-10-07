import type { EdgeLabel, Node, Port } from '../../types';
import { InitUpdater } from '../init-updater/init-updater';
import { InternalUpdater } from '../internal-updater/internal-updater';
import { Updater } from '../updater.interface';

/**
 * CompositeUpdater routes calls to either InitUpdater or InternalUpdater
 * based on whether the relevant initializer has finished.
 * This ensures that once an initializer completes, subsequent calls
 * go directly to InternalUpdater, even if other initializers are still running.
 */
export class CompositeUpdater implements Updater {
  constructor(
    private readonly initUpdater: InitUpdater,
    private readonly internalUpdater: InternalUpdater
  ) {}

  /**
   * Apply node size changes
   * Routes to InitUpdater if node size initializer is not finished, otherwise to InternalUpdater
   */
  applyNodeSize(nodeId: string, size: NonNullable<Node['size']>): void {
    if (this.initUpdater.isNodeSizeInitializerFinished()) {
      this.internalUpdater.applyNodeSize(nodeId, size);
    } else {
      this.initUpdater.applyNodeSize(nodeId, size);
    }
  }

  /**
   * Add a port to a node
   * Routes to InitUpdater if port initializer is not finished, otherwise to InternalUpdater
   */
  addPort(nodeId: string, port: Port): void {
    if (this.initUpdater.isPortInitializerFinished()) {
      this.internalUpdater.addPort(nodeId, port);
    } else {
      this.initUpdater.addPort(nodeId, port);
    }
  }

  /**
   * Apply port size and position updates
   * Routes to InitUpdater if port rect initializer is not finished, otherwise to InternalUpdater
   */
  applyPortsSizesAndPositions(nodeId: string, ports: NonNullable<Pick<Port, 'id' | 'size' | 'position'>>[]): void {
    if (this.initUpdater.isPortRectInitializerFinished()) {
      this.internalUpdater.applyPortsSizesAndPositions(nodeId, ports);
    } else {
      this.initUpdater.applyPortsSizesAndPositions(nodeId, ports);
    }
  }

  /**
   * Add an edge label
   * Routes to InitUpdater if edge label initializer is not finished, otherwise to InternalUpdater
   */
  addEdgeLabel(edgeId: string, label: EdgeLabel): void {
    if (this.initUpdater.isEdgeLabelInitializerFinished()) {
      this.internalUpdater.addEdgeLabel(edgeId, label);
    } else {
      this.initUpdater.addEdgeLabel(edgeId, label);
    }
  }

  /**
   * Apply edge label size changes
   * Routes to InitUpdater if edge label size initializer is not finished, otherwise to InternalUpdater
   */
  applyEdgeLabelSize(edgeId: string, labelId: string, size: NonNullable<EdgeLabel['size']>): void {
    if (this.initUpdater.isEdgeLabelSizeInitializerFinished()) {
      this.internalUpdater.applyEdgeLabelSize(edgeId, labelId, size);
    } else {
      this.initUpdater.applyEdgeLabelSize(edgeId, labelId, size);
    }
  }
}
