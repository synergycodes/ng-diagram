import { inject, Injectable, signal } from '@angular/core';
import { DropEvent } from '@angularflow/core';
import { PaletteItem } from '../../types';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';

@Injectable({ providedIn: 'root' })
export class PaletteService {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  draggedNode = signal<PaletteItem | null>(null);

  onMouseDown(node: PaletteItem) {
    this.draggedNode.set(node);
  }

  onDragStartFromPalette(event: DragEvent, node: PaletteItem) {
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
    const node = data as unknown as PaletteItem;
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
