import { inject, Injectable } from '@angular/core';
import { Node, Event } from '@angularflow/core';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';
import { PaletteNode } from '../../types/palette';

@Injectable({ providedIn: 'root' })
export class PaletteInteractionService {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  onDragStartFromPalette(event: DragEvent, node: PaletteNode) {
    if (event.dataTransfer) {
      if (event.target instanceof HTMLElement) {
        event.dataTransfer?.setDragImage(event?.target, 0, 0);
      }
      event.dataTransfer?.setData('text/plain', JSON.stringify(node));
    }
  }

  handleDropFromPalette(event: Event): void {
    if (event.type === 'drop') {
      const { data, clientPosition } = event;
      const node = data as unknown as Node;
      const flowCore = this.flowCoreProvider.provide();
      flowCore.commandHandler.emit('addNodes', {
        nodes: [
          {
            ...node,
            id: crypto.randomUUID(),
            position: flowCore.clientToFlowPosition({
              x: clientPosition.x,
              y: clientPosition.y,
            }),
          },
        ],
      });
    }
  }
}
