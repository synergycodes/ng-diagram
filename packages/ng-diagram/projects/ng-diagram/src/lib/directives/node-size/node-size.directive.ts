import { computed, Directive, effect, ElementRef, inject, input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { DEFAULT_NODE_MIN_SIZE, isGroup, type Node } from '../../../core/src';
import { FlowCoreProviderService } from '../../services/flow-core-provider/flow-core-provider.service';
import { BatchResizeObserverService } from '../../services/flow-resize-observer/batched-resize-observer.service';

export const DEFAULT_NODE_SIZE = { width: '11.25rem', height: '2rem' };
export const DEFAULT_GROUP_SIZE = { width: '9.0625rem', height: '9.0625rem' };

/**
 * Directive that manages node sizing behavior in the diagram.
 *
 * Handles two sizing modes:
 * 1. **Auto-size mode** (default): Node size adapts to content with configurable defaults
 * 2. **Explicit size mode**: Node has fixed dimensions
 *
 * Size configuration priority:
 * 1. Explicit size from node data (when autoSize=false)
 * 2. Built-in defaults for default node types (no type specified)
 * 3. User's CSS (for custom node types)
 * @internal
 */
@Directive({
  selector: '[ngDiagramNodeSize]',
  standalone: true,
})
export class NodeSizeDirective implements OnDestroy, OnInit {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly batchResizeObserver = inject(BatchResizeObserverService);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

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

  /**
   * Main entry point for setting node size.
   * Determines whether to apply explicit sizing or auto-sizing based on provided dimensions.
   *
   * @param width - Explicit width in pixels
   * @param height - Explicit height in pixels
   */
  private setSize(width?: number, height?: number) {
    const node = this.node();
    const hasExplicitSize = width !== undefined && height !== undefined;

    if (hasExplicitSize) {
      this.applyExplicitSize(width, height, node);
    } else {
      this.applyAutoSize(node);
    }
  }

  /**
   * Applies explicit dimensions to the node.
   * Also sets minimum size constraints based on configuration or defaults.
   *
   * @param width - Explicit width in pixels
   * @param height - Explicit height in pixels
   * @param node - The node to size
   */
  private applyExplicitSize(width: number, height: number, node: Node): void {
    const element = this.hostElement.nativeElement;
    const flowCore = this.flowCoreProvider.provide();
    const minSize = flowCore.config.resize.getMinNodeSize(node);
    const isDefaultNodeType = !node.type;

    this.renderer.setStyle(element, 'width', `${width}px`);
    this.renderer.setStyle(element, 'height', `${height}px`);

    if (minSize || isDefaultNodeType) {
      const minWidth = minSize?.width ?? DEFAULT_NODE_MIN_SIZE.width;
      const minHeight = minSize?.height ?? DEFAULT_NODE_MIN_SIZE.height;
      this.renderer.setStyle(element, 'min-width', `${minWidth}px`);
      this.renderer.setStyle(element, 'min-height', `${minHeight}px`);
    }
  }

  /**
   * Applies auto-sizing to the node based on built-in defaults.
   * For custom nodes, resets inline styles to let CSS take control.
   *
   * @param node - The node to size
   */
  private applyAutoSize(node: Node): void {
    if (node.type) {
      this.resetExplicitSizes();
      return;
    }

    if (isGroup(node)) {
      this.applyDefaultGroupSize();
    } else {
      this.applyDefaultNodeSize();
    }
  }

  /**
   * Applies sizing for default group nodes.
   * Default groups get both explicit dimensions and minimum constraints to ensure
   * their bounds are visually apparent even when empty.
   *
   * @param size - The size to apply
   */
  private applyDefaultGroupSize(): void {
    const element = this.hostElement.nativeElement;
    this.renderer.setStyle(element, 'width', DEFAULT_GROUP_SIZE.width);
    this.renderer.setStyle(element, 'height', DEFAULT_GROUP_SIZE.height);
    this.renderer.setStyle(element, 'min-width', DEFAULT_GROUP_SIZE.width);
    this.renderer.setStyle(element, 'min-height', DEFAULT_GROUP_SIZE.height);
  }

  /**
   * Applies sizing for default nodes.
   * Default nodes use flexible sizing with minimum constraints,
   * allowing content to expand beyond the minimum if needed.
   *
   * @param size - The minimum size to apply
   */
  private applyDefaultNodeSize(): void {
    const element = this.hostElement.nativeElement;
    this.renderer.setStyle(element, 'width', 'unset');
    this.renderer.setStyle(element, 'height', 'unset');
    this.renderer.setStyle(element, 'min-width', DEFAULT_NODE_SIZE.width);
    this.renderer.setStyle(element, 'min-height', DEFAULT_NODE_SIZE.height);
  }

  /**
   * Resets explicit width/height styles to allow content-based sizing.
   * Used for custom node types without configuration.
   */
  private resetExplicitSizes(): void {
    const element = this.hostElement.nativeElement;
    this.renderer.setStyle(element, 'width', 'unset');
    this.renderer.setStyle(element, 'height', 'unset');
    this.renderer.setStyle(element, 'min-width', 'unset');
    this.renderer.setStyle(element, 'min-height', 'unset');
  }

  /**
   * Connects the resize observer to track node size changes.
   * This allows the diagram to update port positions and other
   * size-dependent features when nodes resize.
   */
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
