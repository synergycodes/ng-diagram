import { inject, Injectable } from '@angular/core';
import { Port } from '@angularflow/core';
import { findParentWithClass } from '../../utils/find-parent-with-class';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';

@Injectable()
export class UpdatePortsService {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  getPortData(port: HTMLElement): Required<Pick<Port, 'size' | 'position'>> {
    const nodeElement = findParentWithClass(port, 'ng-diagram-node');
    if (!nodeElement) {
      throw new Error(`Parent node of port with id ${port.id} not found`);
    }
    const portRect = port.getBoundingClientRect();
    const nodeRect = nodeElement.getBoundingClientRect();

    const scale = this.getScale();

    const width = portRect.width / scale;
    const height = portRect.height / scale;

    const relativeX = (portRect.left - nodeRect.left) / scale;
    const relativeY = (portRect.top - nodeRect.top) / scale;

    return {
      position: { x: relativeX, y: relativeY },
      size: { width, height },
    };
  }

  getNodePortsData(nodeId: string): Required<Pick<Port, 'id' | 'size' | 'position'>>[] {
    const node = document.querySelector(`.ng-diagram-node[data-node-id="${nodeId}"]`) as HTMLElement;
    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    const ports = node.querySelectorAll('[data-port-id]') as NodeListOf<HTMLElement>;
    const portsData: Required<Pick<Port, 'id' | 'size' | 'position'>>[] = [];

    ports.forEach((port) => {
      const portId = port.getAttribute('data-port-id');
      if (!portId) {
        throw new Error(`Port with id ${port.id} in node ${nodeId} not found`);
      }

      const { size, position } = this.getPortData(port);
      portsData.push({ id: portId, size, position });
    });

    return portsData;
  }

  private getScale() {
    return this.flowCoreProvider.provide().getState().metadata.viewport.scale;
  }
}
