import { computed, Directive, effect, ElementRef, inject, input, OnDestroy, Renderer2 } from '@angular/core';
import type { Node } from '@angularflow/core';

import { EventMapperService, UpdatePortsService } from '../../services';

@Directive({
  selector: '[angularAdapterNodeSize]',
})
export class NodeSizeDirective implements OnDestroy {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly eventMapperService = inject(EventMapperService);
  private readonly renderer = inject(Renderer2);
  private readonly updatePortsService = inject(UpdatePortsService);
  private resizeObserver!: ResizeObserver;

  isDestroyed = false;
  data = input.required<Node>();
  size = computed(() => this.data().size);
  autoSize = computed(() => this.data().autoSize ?? true);
  id = computed(() => this.data().id);

  sizeState = computed(() => ({
    size: this.size(),
    autoSize: this.autoSize(),
  }));

  constructor() {
    effect(() => {
      const { size, autoSize } = this.sizeState();
      if (!autoSize && size) {
        const { width, height } = this.size()!;
        this.setSize(width, height);
        this.disconnectResizeObserver();
      } else {
        this.setSize();
        this.createResizeObserver();
      }
    });
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    this.disconnectResizeObserver();
  }

  private setSize(width?: number, height?: number) {
    this.renderer.setStyle(this.hostElement.nativeElement, 'width', width ? `${width}px` : 'unset');
    this.renderer.setStyle(this.hostElement.nativeElement, 'height', height ? `${height}px` : 'unset');
  }

  private createResizeObserver() {
    this.resizeObserver = new ResizeObserver((entries) => {
      const borderBox = entries[0].borderBoxSize?.[0];
      if (borderBox && !this.isDestroyed) {
        const width = borderBox.inlineSize;
        const height = borderBox.blockSize;
        this.eventMapperService.emit({
          type: 'resize',
          target: { type: 'node', element: this.data() },
          width,
          height,
          timestamp: Date.now(),
        });
        this.updatePortsService.updateNodePorts(this.id());
      }
    });
    this.resizeObserver.observe(this.hostElement.nativeElement);
  }

  private disconnectResizeObserver() {
    this.resizeObserver?.disconnect();
  }
}
