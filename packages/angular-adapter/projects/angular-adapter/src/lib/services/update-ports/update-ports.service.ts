import { inject, Injectable } from '@angular/core';
import { Port } from '@angularflow/core';
import { findParentWithClass } from '../../utils/find-parent-with-class';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';

@Injectable({
  providedIn: 'root',
})
export class UpdatePortsService {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  getPortData(port: HTMLElement): { position: Port['position']; side: Port['side']; size: Port['size'] } {
    const nodeElement = findParentWithClass(port, 'flow__angular-adapter-node');
    if (!nodeElement) {
      throw new Error(`Parent node of port with id ${port.id} not found`);
    }
    const portRect = port.getBoundingClientRect();
    const nodeRect = nodeElement.getBoundingClientRect();
    const width = port.clientWidth;
    const height = port.clientHeight;

    const relativeX = (portRect.left - nodeRect.left) / this.getScale();
    const relativeY = (portRect.top - nodeRect.top) / this.getScale();

    let side: Port['side'] = 'left';
    const nodeWidth = nodeRect.width;
    const nodeHeight = nodeRect.height;

    const portCenterX = relativeX + width / 2;
    const portCenterY = relativeY + height / 2;

    const distToLeft = portCenterX;
    const distToRight = nodeWidth - portCenterX;
    const distToTop = portCenterY;
    const distToBottom = nodeHeight - portCenterY;

    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    if (minDist === distToLeft) {
      side = 'left';
    } else if (minDist === distToRight) {
      side = 'right';
    } else if (minDist === distToTop) {
      side = 'top';
    } else if (minDist === distToBottom) {
      side = 'bottom';
    }

    return {
      position: { x: relativeX, y: relativeY },
      side,
      size: { width, height },
    };
  }

  updateNodePorts(nodeId: string) {
    const node = document.querySelector(`.flow__angular-adapter-node[data-node-id="${nodeId}"]`) as HTMLElement;
    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    const ports = node.querySelectorAll('[data-port-id]') as NodeListOf<HTMLElement>;
    ports.forEach((port) => {
      const portId = port.getAttribute('data-port-id');
      if (!portId) {
        throw new Error(`Port with id ${port.id} in node ${nodeId} not found`);
      }
      this.flowCoreProvider.provide().commandHandler.emit('updatePort', {
        nodeId,
        portId,
        portChanges: { ...this.getPortData(port) },
      });
    });
  }

  private getScale() {
    return this.flowCoreProvider.provide().getState().metadata.viewport.scale;
  }
}
