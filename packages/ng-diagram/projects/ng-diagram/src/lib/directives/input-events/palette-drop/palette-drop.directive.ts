import { Directive, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';
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

const PALETTE_DROP_NOT_NODE_ERROR = () =>
  `[ngDiagram] Invalid drop data: expected type "NgDiagramPaletteItem".

Received data: "UNKNOWN"

To fix this error:
  • Ensure the dragged data is of type "NgDiagramPaletteItem" and is dragged from a valid palette item.

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
export class PaletteDropDirective implements OnInit, OnDestroy {
  private readonly inputEventsRouterService = inject(InputEventsRouterService);
  private readonly paletteService = inject(PaletteService);
  private readonly el = inject(ElementRef<HTMLElement>);

  private touchMoveListener = (event: TouchEvent) => this.onGlobalTouchMove(event);
  private touchEndListener = (event: TouchEvent) => this.onGlobalTouchEnd(event);

  ngOnInit(): void {
    document.addEventListener('touchmove', this.touchMoveListener, { passive: false });
    document.addEventListener('touchend', this.touchEndListener, { passive: false });
  }

  ngOnDestroy(): void {
    document.removeEventListener('touchmove', this.touchMoveListener);
    document.removeEventListener('touchend', this.touchEndListener);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const dataString = event.dataTransfer?.getData('text/plain');
    const baseEvent = this.inputEventsRouterService.getBaseEvent(event);
    let parsedData = {};

    if (dataString) {
      try {
        parsedData = JSON.parse(dataString);
      } catch (error) {
        if (!this.paletteService.draggedNode()) {
          return console.warn(PALETTE_DROP_NOT_NODE_ERROR());
        }
        return console.error(PALETTE_DROP_JSON_PARSE_ERROR(dataString, error));
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
    this.paletteService.previewId.set(null);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private onGlobalTouchMove(event: TouchEvent) {
    if (this.paletteService.draggedNode()) {
      event.preventDefault();
    }
  }

  private onGlobalTouchEnd(event: TouchEvent) {
    const dragged = this.paletteService.draggedNode();
    if (!dragged) return;
    const touch = event.changedTouches[0];
    if (!touch) return;

    const dropElement = this.el.nativeElement;
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!target || !dropElement.contains(target)) {
      // Not dropped on this area, just clear drag
      this.paletteService.draggedNode.set(null);
      this.paletteService.previewId.set(null);
      return;
    }

    const baseEvent = this.inputEventsRouterService.getBaseEvent(event);
    this.inputEventsRouterService.emit({
      ...baseEvent,
      name: 'paletteDrop',
      data: dragged,
      lastInputPoint: {
        x: touch.clientX,
        y: touch.clientY,
      },
    });

    this.paletteService.draggedNode.set(null);
    this.paletteService.previewId.set(null);

    event.preventDefault();
    event.stopPropagation();
  }
}
