import { computed, Directive, effect, ElementRef, inject, input, OnDestroy, Renderer2 } from '@angular/core';
import { type Node } from '@angularflow/core';
import { FlowCoreProviderService, UpdatePortsService } from '../../services';

@Directive({
  selector: '[angularAdapterNodeSize]',
})
export class NodeSizeDirective implements OnDestroy {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly flowCore = inject(FlowCoreProviderService);
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

        const size = { width, height };

        this.flowCore.provide().internalUpdater.applyNodeSize(this.id(), { size });

        // TODO: fix problem with DOM position resync after repaint
        const portsData = this.updatePortsService.getNodePortsData(this.id());
        this.flowCore.provide().internalUpdater.applyPortsSizesAndPositions(this.id(), portsData);
      }
    });
    this.resizeObserver.observe(this.hostElement.nativeElement);
  }

  private disconnectResizeObserver() {
    this.resizeObserver?.disconnect();
  }
}
