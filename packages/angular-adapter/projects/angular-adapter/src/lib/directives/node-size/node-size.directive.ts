import { computed, Directive, effect, ElementRef, inject, input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { type Node } from '@angularflow/core';
import { BatchResizeObserverService } from '../../services/flow-resize-observer/batched-resize-observer.service';

@Directive({
  selector: '[ngDiagramNodeSize]',
})
export class NodeSizeDirective implements OnDestroy, OnInit {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly batchResizeObserver = inject(BatchResizeObserverService);

  node = input.required<Node>();
  size = computed(() => this.node().size);
  autoSize = computed(() => this.node().autoSize ?? true);
  id = computed(() => this.node().id);

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
      } else {
        this.setSize();
      }
    });
  }

  ngOnInit() {
    this.connectResizeObserver();
  }

  ngOnDestroy() {
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
