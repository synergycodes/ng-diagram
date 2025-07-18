import { inject, Injectable, signal } from '@angular/core';
import { DropEvent } from '@angularflow/core';
import { PaletteNode } from '../../types';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';

@Injectable({ providedIn: 'root' })
export class PaletteService {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  draggedNode = signal<PaletteNode | null>(null);

  onMouseDown(node: PaletteNode) {
    this.draggedNode.set(node);
  }

  onDragStartFromPalette(event: DragEvent, node: PaletteNode) {
    if (event.dataTransfer) {
      event.dataTransfer?.setData('text/plain', JSON.stringify(node));
    }
  }

  registerDropFromPalette(): void {
    const flowCore = this.flowCoreProvider.provide();
    flowCore.registerEventsHandler((event) => {
      if (event.type === 'drop') {
        this.handleDropFromPalette(event);
      }
    });
  }

  private handleDropFromPalette(event: DropEvent): void {
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
    this.draggedNode.set(null);
  }
}
