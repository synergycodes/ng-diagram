import { computed, Directive, effect, ElementRef, inject, input, OnDestroy, Renderer2 } from '@angular/core';
import { type Node } from '@angularflow/core';
import { BatchResizeObserverService } from '../../services/flow-resize-observer/batched-resize-observer.service';

@Directive({
  selector: '[angularAdapterNodeSize]',
})
export class NodeSizeDirective implements OnDestroy {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly batchResizeObserver = inject(BatchResizeObserverService);

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
        this.connectResizeObserver();
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

  private connectResizeObserver() {
    this.batchResizeObserver.observe(this.hostElement.nativeElement, {
      type: 'node',
      nodeId: this.id(),
    });
  }

  private disconnectResizeObserver() {
    this.batchResizeObserver.unobserve(this.hostElement.nativeElement);
  }
}
