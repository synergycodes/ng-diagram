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
  applyNodeSize(nodeId: string, size: NonNullable<Node['size']>) {
    const node = this.flowCore.getNodeById(nodeId);
    if (!node || isSameRect(getRect(node), getRect({ size }))) {
      return;
    }
    if (this.flowCore.initializationGuard.isInitialized) {
      this.flowCore.commandHandler.emit('resizeNode', { id: nodeId, size });
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
      this.flowCore.commandHandler.emit('addPorts', { nodeId, ports: [port] });
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
  applyPortsSizesAndPositions(
    nodeId: string,
    ports: { portId: string; size: NonNullable<Port['size']>; position: NonNullable<Port['position']> }[]
  ) {
    const node = this.flowCore.getNodeById(nodeId);
    const allPortsMap = new Map<string, { size: Port['size']; position: Port['position'] }>();
    node?.ports?.forEach(({ id, size, position }) => allPortsMap.set(id, { size, position }));
    const portsToUpdate = ports.filter(({ portId, size, position }) => {
      const port = allPortsMap.get(portId);
      return port && !isSameRect(getRect(port), getRect({ size, position }));
    });
    if (!portsToUpdate?.length) {
      return;
    }
    if (this.flowCore.initializationGuard.isInitialized) {
      this.flowCore.commandHandler.emit('updatePorts', {
        nodeId,
        ports: portsToUpdate.map(({ portId, size, position }) => ({ portId, portChanges: { size, position } })),
      });
    } else {
      portsToUpdate.forEach(({ portId, size, position }) => {
        this.flowCore.initializationGuard.initPortSizeAndPosition(nodeId, portId, size, position);
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
}
