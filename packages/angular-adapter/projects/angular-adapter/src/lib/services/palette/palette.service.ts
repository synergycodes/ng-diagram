import { Injectable, signal } from '@angular/core';
import { PaletteItem } from '../../types';

@Injectable({ providedIn: 'root' })
export class PaletteService {
  draggedNode = signal<PaletteItem | null>(null);

  onMouseDown(node: PaletteItem) {
    this.draggedNode.set(node);
  }

  onDragStartFromPalette(event: DragEvent, node: PaletteItem) {
    if (event.dataTransfer) {
      event.dataTransfer?.setData('text/plain', JSON.stringify(node));
    }
  }
}
