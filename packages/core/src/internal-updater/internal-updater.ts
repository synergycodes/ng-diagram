import { FlowCore } from '../flow-core';
import type { Node, Port } from '../types';
import { EdgeLabel } from '../types';
import { getRect, isSameRect } from '../utils';

export class InternalUpdater {
  constructor(private readonly flowCore: FlowCore) {}

  /**
   * @internal
   * Internal method to initialize a node size
   * @param nodeId Node id
   * @param size Size
   */
  applyNodeSize(
    nodeId: string,
    {
      size,
    }: {
      size: NonNullable<Node['size']>;
    }
  ) {
    const node = this.flowCore.getNodeById(nodeId);

    // If the node size is the same the ports should be the same too
    if (!node || isSameRect(getRect(node), getRect({ size }))) {
      return;
    }

    if (this.flowCore.initializationGuard.isInitialized) {
      this.flowCore.commandHandler.emit('resizeNode', {
        id: nodeId,
        size,
      });
    } else {
      this.flowCore.initializationGuard.initNodeSize(nodeId, size);
    }
  }

  /**
   * @internal
   * Internal method to add a new port to the flow
   * @param nodeId Node id
   * @param portId Port id
   */
  addPort(nodeId: string, port: Port) {
    if (this.flowCore.initializationGuard.isInitialized) {
      this.flowCore.portBatchProcessor.process(nodeId, port, (nodeId, ports) => {
        this.flowCore.commandHandler.emit('addPorts', { nodeId, ports });
      });
    } else {
      this.flowCore.initializationGuard.addPort(nodeId, port);
    }
  }

  /**
   * @internal
   * Internal method to apply a port size and position
   * @param nodeId Node id
   * @param ports Ports with size and position
   */
  applyPortsSizesAndPositions(nodeId: string, ports: NonNullable<Pick<Port, 'id' | 'size' | 'position'>>[]) {
    const node = this.flowCore.getNodeById(nodeId);

    if (!node) {
      return;
    }

    const portsToUpdate = this.getPortsToUpdate(node, ports);

    if (!portsToUpdate?.length) {
      return;
    }
    if (this.flowCore.initializationGuard.isInitialized) {
      this.flowCore.commandHandler.emit('updatePorts', {
        nodeId,
        ports: portsToUpdate.map(({ id, size, position }) => ({ portId: id, portChanges: { size, position } })),
      });
    } else {
      portsToUpdate.forEach(({ id, size, position }) => {
        this.flowCore.initializationGuard.initPortSizeAndPosition(nodeId, id, size!, position!);
      });
    }
  }

  /**
   * @internal
   * Internal method to add a new edge label to the flow
   * @param edgeId Edge id
   * @param label Label
   */
  addEdgeLabel(edgeId: string, label: EdgeLabel) {
    if (this.flowCore.initializationGuard.isInitialized) {
      this.flowCore.commandHandler.emit('addEdgeLabels', { edgeId, labels: [label] });
    } else {
      this.flowCore.initializationGuard.addEdgeLabel(edgeId, label);
    }
  }

  /**
   * @internal
   * Internal method to apply a edge label size and position
   * @param edgeId Edge id
   * @param labelId Label id
   * @param size Size
   * @param position Position
   */
  applyEdgeLabelSize(edgeId: string, labelId: string, size: NonNullable<EdgeLabel['size']>) {
    const edge = this.flowCore.getEdgeById(edgeId);
    const label = edge?.labels?.find((label) => label.id === labelId);
    if (!label || isSameRect(getRect({ size: label.size }), getRect({ size }))) {
      return;
    }
    if (this.flowCore.initializationGuard.isInitialized) {
      this.flowCore.commandHandler.emit('updateEdgeLabel', { edgeId, labelId, labelChanges: { size } });
    } else {
      this.flowCore.initializationGuard.initEdgeLabelSize(edgeId, labelId, size);
    }
  }

  private getPortsToUpdate(node: Node, ports: NonNullable<Pick<Port, 'id' | 'size' | 'position'>>[]) {
    const allPortsMap = new Map<string, { size: Port['size']; position: Port['position'] }>();
    node?.ports?.forEach(({ id, size, position }) => allPortsMap.set(id, { size, position }));

    return ports.filter(({ id, size, position }) => {
      const port = allPortsMap.get(id);

      return port && !isSameRect(getRect(port), getRect({ size, position }));
    });
  }
}
