import { inject, Injectable } from '@angular/core';
import { DropEvent } from '@angularflow/core';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';
import { PaletteNode } from '../../types';

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

  handleDropFromPalette(event: DropEvent): void {
    const { data, clientPosition } = event;
    const node = data as unknown as PaletteNode;
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
