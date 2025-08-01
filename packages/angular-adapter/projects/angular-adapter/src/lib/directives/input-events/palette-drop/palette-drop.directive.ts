import { Directive, inject } from '@angular/core';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PaletteService } from '../../../services/palette/palette.service';

@Directive({
  selector: '[ngDiagramPaletteDrop]',
  host: {
    '(drop)': 'onDrop($event)',
    '(dragover)': 'onDragOver($event)',
  },
})
export class PaletteDropDirective {
  private readonly inputEventsRouterService = inject(InputEventsRouterService);
  private readonly paletteService = inject(PaletteService);

  onDrop(event: DragEvent) {
    event.preventDefault();
    const dataString = event.dataTransfer?.getData('text/plain');
    const baseEvent = this.inputEventsRouterService.getBaseEvent(event);
    this.inputEventsRouterService.emit({
      ...baseEvent,
      name: 'paletteDrop',
      data: dataString ? JSON.parse(dataString) : {},
      lastInputPoint: {
        x: event.clientX,
        y: event.clientY,
      },
    });

    this.paletteService.draggedNode.set(null);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }
}
