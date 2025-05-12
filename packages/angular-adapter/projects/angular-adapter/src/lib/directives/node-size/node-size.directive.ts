import { Directive, ElementRef, inject, input, OnDestroy, OnInit } from '@angular/core';
import type { EventTarget } from '@angularflow/core';
import { EventMapperService } from '../../services';

@Directive({
  selector: '[angularAdapterNodeSize]',
})
export class NodeSizeDirective implements OnInit, OnDestroy {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly eventMapperService = inject(EventMapperService);
  private resizeObserver!: ResizeObserver;
  eventTarget = input<EventTarget>({ type: 'diagram' });

  ngOnInit() {
    this.resizeObserver = new ResizeObserver((entries) => {
      const borderBox = entries[0].borderBoxSize?.[0];
      if (borderBox) {
        const width = borderBox.inlineSize;
        const height = borderBox.blockSize;
        this.eventMapperService.emit({
          type: 'resize',
          target: this.eventTarget(),
          width,
          height,
          timestamp: Date.now(),
        });
      }
    });

    this.resizeObserver.observe(this.hostElement.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObserver.disconnect();
  }
}
