import { Directive, inject } from '@angular/core';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { PaletteService } from '../../../services/palette/palette.service';

const PALETTE_DROP_JSON_PARSE_ERROR = (dataString: string, error: unknown) =>
  `[ngDiagram] Failed to parse palette drop data as JSON.

Received data: "${dataString}"
Error: ${error instanceof Error ? error.message : String(error)}

Note: This error typically occurs when implementing custom drag-and-drop functionality.
The built-in palette component handles data serialization correctly.

To fix custom implementations:
  • Ensure the dragged data is valid JSON format
  • Use JSON.stringify() when setting the drag data
  • Example: event.dataTransfer.setData('text/plain', JSON.stringify({ type: 'node', data: {...} }))

The palette drop event will continue with empty data object.

Documentation: https://www.ngdiagram.dev/docs/guides/palette/
`;

@Directive({
  selector: '[ngDiagramPaletteDrop]',
  standalone: true,
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

    let parsedData = {};
    if (dataString) {
      try {
        parsedData = JSON.parse(dataString);
      } catch (error) {
        console.error(PALETTE_DROP_JSON_PARSE_ERROR(dataString, error));
      }
    }

    this.inputEventsRouterService.emit({
      ...baseEvent,
      name: 'paletteDrop',
      data: parsedData,
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
