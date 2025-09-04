import { Injectable, signal } from '@angular/core';
import { NgDiagramPaletteItem } from '../../types';

@Injectable()
export class PaletteService {
  draggedNode = signal<NgDiagramPaletteItem | null>(null);
  previewId = signal<string | null>(null);

  onMouseDown(node: NgDiagramPaletteItem, previewId: string) {
    this.draggedNode.set(node);
    this.previewId.set(previewId);
  }

  onDragStartFromPalette(event: DragEvent, node: NgDiagramPaletteItem) {
    if (event.dataTransfer) {
      event.dataTransfer?.setData('text/plain', JSON.stringify(node));
    }
  }
}
