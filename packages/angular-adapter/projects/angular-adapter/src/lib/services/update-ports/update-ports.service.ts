import { inject, Injectable } from '@angular/core';
import { Port } from '@angularflow/core';
import { findParentWithClass } from '../../utils/find-parent-with-class';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';

@Injectable({
  providedIn: 'root',
})
export class UpdatePortsService {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  getPortData(port: HTMLElement): { position: NonNullable<Port['position']>; size: NonNullable<Port['size']> } {
    const nodeElement = findParentWithClass(port, 'flow__angular-adapter-node');
    if (!nodeElement) {
      throw new Error(`Parent node of port with id ${port.id} not found`);
    }
    const portRect = port.getBoundingClientRect();
    const nodeRect = nodeElement.getBoundingClientRect();

    const width = portRect.width / this.getScale();
    const height = portRect.height / this.getScale();

    const relativeX = (portRect.left - nodeRect.left) / this.getScale();
    const relativeY = (portRect.top - nodeRect.top) / this.getScale();

    return {
      position: { x: relativeX, y: relativeY },
      size: { width, height },
    };
  }

  updateNodePorts(nodeId: string) {
    const node = document.querySelector(`.flow__angular-adapter-node[data-node-id="${nodeId}"]`) as HTMLElement;
    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    const ports = node.querySelectorAll('[data-port-id]') as NodeListOf<HTMLElement>;
    const portsToUpdate: {
      portId: string;
      size: NonNullable<Port['size']>;
      position: NonNullable<Port['position']>;
    }[] = [];
    ports.forEach((port) => {
      const portId = port.getAttribute('data-port-id');
      if (!portId) {
        throw new Error(`Port with id ${port.id} in node ${nodeId} not found`);
      }

      const { size, position } = this.getPortData(port);
      portsToUpdate.push({ portId, size, position });
    });
    this.flowCoreProvider.provide().internalUpdater.applyPortsSizesAndPositions(nodeId, portsToUpdate);
  }

  private getScale() {
    return this.flowCoreProvider.provide().getState().metadata.viewport.scale;
  }
}
