import { ElementRef, inject, Injectable } from '@angular/core';
import { Port } from '../../../core/src';
import { findParentWithClass } from '../../utils/find-parent-with-class';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';

const PORT_PARENT_NOT_FOUND_ERROR = (portId: string) =>
  `[ngDiagram] Port measurement failed: Parent node not found.

Port ID: ${portId}

This may occur during DOM updates or node removal.

Documentation: https://www.ngdiagram.dev/docs/guides/nodes/ports/
`;

const NODE_ELEMENT_NOT_FOUND_ERROR = (nodeId: string) =>
  `[ngDiagram] Node measurement failed: Node element not found.

Node ID: ${nodeId}

This may occur during DOM updates or node removal.

Documentation: https://www.ngdiagram.dev/docs/guides/nodes/nodes/
`;

const PORT_ID_MISSING_ERROR = (portElementId: string, nodeId: string) =>
  `[ngDiagram] Port measurement failed: Missing data-port-id attribute.

Port element ID: ${portElementId}
Node ID: ${nodeId}

To fix this:
  • Add [id]="port.id" to port components
  • Ensure all ports have unique IDs

Skipping this port.

Documentation: https://www.ngdiagram.dev/docs/guides/nodes/ports/
`;

@Injectable()
export class UpdatePortsService {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly diagramElement = inject(ElementRef<HTMLElement>);

  getPortData(port: HTMLElement): Required<Pick<Port, 'size' | 'position'>> | null {
    const nodeElement = findParentWithClass(port, 'ng-diagram-node');
    if (!nodeElement) {
      console.error(PORT_PARENT_NOT_FOUND_ERROR(port.id));
      return null;
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
    const node = this.diagramElement.nativeElement.querySelector(
      `.ng-diagram-node[data-node-id="${nodeId}"]`
    ) as HTMLElement;
    if (!node) {
      console.error(NODE_ELEMENT_NOT_FOUND_ERROR(nodeId));
      return [];
    }

    const ports = node.querySelectorAll('[data-port-id]') as NodeListOf<HTMLElement>;
    const portsData: Required<Pick<Port, 'id' | 'size' | 'position'>>[] = [];

    ports.forEach((port) => {
      const portId = port.getAttribute('data-port-id');
      if (!portId) {
        console.error(PORT_ID_MISSING_ERROR(port.id, nodeId));
        return;
      }

      const portData = this.getPortData(port);
      if (!portData) {
        return;
      }

      portsData.push({ id: portId, size: portData.size, position: portData.position });
    });

    return portsData;
  }

  private getScale() {
    return this.flowCoreProvider.provide().getState().metadata.viewport.scale;
  }
}
