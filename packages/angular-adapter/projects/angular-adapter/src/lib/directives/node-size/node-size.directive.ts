import { computed, Directive, effect, ElementRef, inject, input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { DEFAULT_GROUP_SIZE, DEFAULT_MIN_NODE_SIZE, DEFAULT_NODE_SIZE, isGroup, type Node } from '@angularflow/core';
import { FlowCoreProviderService } from '../../services/flow-core-provider/flow-core-provider.service';
import { BatchResizeObserverService } from '../../services/flow-resize-observer/batched-resize-observer.service';

/**
 * Directive that manages node sizing behavior in the diagram.
 *
 * Handles two sizing modes:
 * 1. **Auto-size mode** (default): Node size adapts to content with configurable defaults
 * 2. **Explicit size mode**: Node has fixed dimensions
 *
 * Size configuration priority:
 * 1. Explicit size from node data (when autoSize=false)
 * 2. Config-provided default size via `getDefaultNodeSize`
 * 3. Fallback sizes for default node types
 * 4. User's CSS (for custom node types without config)
 */
@Directive({
  selector: '[ngDiagramNodeSize]',
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
      const minWidth = minSize?.width ?? DEFAULT_MIN_NODE_SIZE.width;
      const minHeight = minSize?.height ?? DEFAULT_MIN_NODE_SIZE.height;
      this.renderer.setStyle(element, 'min-width', `${minWidth}px`);
      this.renderer.setStyle(element, 'min-height', `${minHeight}px`);
    }
  }

  /**
   * Applies auto-sizing to the node based on configuration or defaults.
   * For custom nodes without config, resets inline styles to let CSS take control.
   *
   * @param node - The node to size
   */
  private applyAutoSize(node: Node): void {
    const defaultSize = this.getDefaultSize(node);

    if (!defaultSize) {
      this.resetExplicitSizes();
      return;
    }

    if (isGroup(node)) {
      this.applyGroupSize(defaultSize);
    } else {
      this.applyNodeSize(defaultSize);
    }
  }

  /**
   * Determines the default size for a node in auto-size mode.
   *
   * Priority order:
   * 1. Size from config's `getDefaultNodeSize` function
   * 2. Fallback sizes for default node types
   * 3. null for custom node types without config
   *
   * @param node - The node to get default size for
   * @returns Default size or null if no defaults apply
   */
  private getDefaultSize(node: Node): { width: number; height: number } | null {
    const flowCore = this.flowCoreProvider.provide();
    const defaultSize = flowCore.config.getDefaultNodeSize?.(node);

    if (defaultSize) {
      return defaultSize;
    }

    const isDefaultNodeType = !node.type;
    if (isDefaultNodeType) {
      return isGroup(node) ? DEFAULT_GROUP_SIZE : DEFAULT_NODE_SIZE;
    }

    return null;
  }

  /**
   * Applies sizing for group nodes.
   * Groups get both explicit dimensions and minimum constraints to ensure
   * their bounds are visually apparent even when empty.
   *
   * @param size - The size to apply
   */
  private applyGroupSize(size: { width: number; height: number }): void {
    const element = this.hostElement.nativeElement;
    this.renderer.setStyle(element, 'width', `${size.width}px`);
    this.renderer.setStyle(element, 'height', `${size.height}px`);
    this.renderer.setStyle(element, 'min-width', `${size.width}px`);
    this.renderer.setStyle(element, 'min-height', `${size.height}px`);
  }

  /**
   * Applies sizing for regular (non-group) nodes.
   * Regular nodes use flexible sizing with minimum constraints,
   * allowing content to expand beyond the minimum if needed.
   *
   * @param size - The minimum size to apply
   */
  private applyNodeSize(size: { width: number; height: number }): void {
    const element = this.hostElement.nativeElement;
    this.renderer.setStyle(element, 'width', 'unset');
    this.renderer.setStyle(element, 'height', 'unset');
    this.renderer.setStyle(element, 'min-width', `${size.width}px`);
    this.renderer.setStyle(element, 'min-height', `${size.height}px`);
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
