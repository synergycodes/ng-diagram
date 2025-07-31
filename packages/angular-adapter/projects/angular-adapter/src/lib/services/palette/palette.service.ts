import { Injectable, signal } from '@angular/core';
import { NgDiagramPaletteItem } from '../../types';

@Injectable({ providedIn: 'root' })
export class PaletteService {
  draggedNode = signal<NgDiagramPaletteItem | null>(null);

  onMouseDown(node: NgDiagramPaletteItem) {
    this.draggedNode.set(node);
  }

  onDragStartFromPalette(event: DragEvent, node: NgDiagramPaletteItem) {
    if (event.dataTransfer) {
      event.dataTransfer?.setData('text/plain', JSON.stringify(node));
    }
  }
}
