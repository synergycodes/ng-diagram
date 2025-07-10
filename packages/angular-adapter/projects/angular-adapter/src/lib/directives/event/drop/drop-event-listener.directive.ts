import { Directive, inject } from '@angular/core';

import { DropEvent } from '@angularflow/core';
import { EventMapperService } from '../../../services';

@Directive({
  selector: '[angularAdapterDropEventListener]',
  host: {
    '(drop)': 'onDrop($event)',
    '(dragover)': 'onDragOver($event)',
  },
})
export class DropEventListenerDirective {
  private readonly eventMapperService = inject(EventMapperService);

  onDrop(event: DragEvent) {
    event.preventDefault();
    const dataString = event.dataTransfer?.getData('text/plain');

    this.eventMapperService.emit({
      type: 'drop',
      target: { type: 'diagram' },
      timestamp: Date.now(),
      data: dataString ? JSON.parse(dataString) : {},
      clientPosition: {
        x: event.clientX,
        y: event.clientY,
      },
    } as DropEvent);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }
}
