import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  EventEmitter,
  inject,
  input,
  OnDestroy,
  OnInit,
  Output,
  untracked,
} from '@angular/core';
import { Edge, Node } from '../../../core/src';

import type {
  ClipboardPastedEvent,
  DiagramInitEvent,
  EdgeDrawnEvent,
  GroupMembershipChangedEvent,
  GroupNode,
  MiddlewareChain,
  ModelAdapter,
  NodeDragEndedEvent,
  NodeDragStartedEvent,
  NodeResizeEndedEvent,
  NodeResizedEvent,
  NodeResizeStartedEvent,
  NodeRotateEndedEvent,
  NodeRotateStartedEvent,
  PaletteItemDroppedEvent,
  SelectionChangedEvent,
  SelectionGestureEndedEvent,
  SelectionMovedEvent,
  SelectionRemovedEvent,
  SelectionRotatedEvent,
  ViewportChangedEvent,
} from '../../../core/src';

import { MobileBoxSelectionDirective } from '../../../public-api';
import { DiagramSelectionDirective } from '../../directives';
import { CursorPositionTrackerDirective } from '../../directives/cursor-position-tracker/cursor-position-tracker.directive';
import { BoxSelectionDirective } from '../../directives/input-events/box-selection/box-selection.directive';
import { KeyboardInputsDirective } from '../../directives/input-events/keyboard-inputs/keyboard-inputs.directive';
import { PaletteDropDirective } from '../../directives/input-events/palette-drop/palette-drop.directive';
import { MobilePanningDirective } from '../../directives/input-events/panning/mobile-panning.directive';
import { PanningDirective } from '../../directives/input-events/panning/panning.directive';
import { MobileZoomingDirective } from '../../directives/input-events/zooming/mobile-zooming.directive';
import { ZoomingWheelDirective } from '../../directives/input-events/zooming/zooming-wheel.directive';
import { NgDiagramServicesAvailabilityCheckerDirective } from '../../directives/services-availability-checker/ng-diagram-services-availability-checker.directive';
import { FlowCoreProviderService, FlowResizeBatchProcessorService, RendererService } from '../../services';
import { TemplateProviderService } from '../../services/template-provider/template-provider.service';
import { NgDiagramConfig, NgDiagramEdgeTemplateMap, NgDiagramNodeTemplateMap } from '../../types';
import { BUILTIN_MIDDLEWARES } from '../../utils/create-middlewares';
import { NgDiagramBoxSelectionComponent } from '../box-selection/ng-diagram-box-selection.component';
import { NgDiagramCanvasComponent } from '../canvas/ng-diagram-canvas.component';
import { NgDiagramDefaultEdgeComponent } from '../edge/default-edge/default-edge.component';
import { NgDiagramMarkerArrowComponent } from '../edge/markers/marker-arrow.component';
import { NgDiagramEdgeComponent } from '../edge/ng-diagram-edge.component';
import { NgDiagramDefaultGroupTemplateComponent } from '../node/default-group-template/ng-diagram-default-group-template.component';
import { NgDiagramDefaultNodeTemplateComponent } from '../node/default-node-template/ng-diagram-default-node-template.component';
import { NgDiagramNodeComponent } from '../node/ng-diagram-node.component';
import { NgDiagramWatermarkComponent } from '../watermark/watermark.component';

/**
 * Main diagram component for rendering flow diagrams with nodes and edges.
 *
 * @public
 * @since 0.8.0
 * @category Components
 */
@Component({
  selector: 'ng-diagram',
  standalone: true,
  imports: [
    CommonModule,
    NgDiagramCanvasComponent,
    NgDiagramNodeComponent,
    NgDiagramMarkerArrowComponent,
    NgDiagramDefaultEdgeComponent,
    NgDiagramDefaultNodeTemplateComponent,
    NgDiagramDefaultGroupTemplateComponent,
    NgDiagramEdgeComponent,
    NgDiagramWatermarkComponent,
    NgDiagramBoxSelectionComponent,
  ],
  templateUrl: './ng-diagram.component.html',
  styleUrl: './ng-diagram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    NgDiagramServicesAvailabilityCheckerDirective,
    BoxSelectionDirective,
    MobileBoxSelectionDirective,
    CursorPositionTrackerDirective,
    ZoomingWheelDirective,
    PanningDirective,
    MobilePanningDirective,
    MobileZoomingDirective,
    KeyboardInputsDirective,
    PaletteDropDirective,
    DiagramSelectionDirective,
  ],
  host: {
    '[class.pannable]': 'viewportPannable()',
  },
})
export class NgDiagramComponent implements OnInit, OnDestroy {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly renderer = inject(RendererService);
  private readonly flowResizeBatchProcessor = inject(FlowResizeBatchProcessorService);
  private readonly templateProviderService = inject(TemplateProviderService);

  private initializedModel: ModelAdapter | null = null;
  private resizeObserver: ResizeObserver | null = null;

  /**
   * Global configuration options for the diagram.
   */
  config = input<NgDiagramConfig>();

  /**
   * The model to use in the diagram.
   */
  model = input.required<ModelAdapter>();

  /**
   * Optional — the initial middlewares to use.
   * When provided, the middleware list can be modified to add new items,
   * replace existing ones, or override the defaults.
   *
   * ⚠️ Use with caution — incorrectly implemented custom middlewares
   * can degrade performance or completely break the data flow.
   */
  middlewares = input<MiddlewareChain>(BUILTIN_MIDDLEWARES);

  /**
   * The node template map to use for the diagram.
   */
  nodeTemplateMap = input<NgDiagramNodeTemplateMap>(new NgDiagramNodeTemplateMap());

  /**
   * The edge template map to use for the diagram.
   * Optional - if not provided, default edge rendering will be used.
   */
  edgeTemplateMap = input<NgDiagramEdgeTemplateMap>(new NgDiagramEdgeTemplateMap());

  readonly nodes = this.renderer.nodes;
  readonly edges = this.renderer.edges;
  readonly viewport = this.renderer.viewport;

  /** Whether panning is enabled in the diagram. */
  readonly viewportPannable = this.renderer.viewportPannable;

  /**
   * Event emitted when the diagram initialization is complete.
   *
   * This event fires after all nodes and edges including their internal parts
   * (ports, labels) have been measured and positioned.
   */
  @Output() diagramInit = new EventEmitter<DiagramInitEvent>();

  /**
   * Event emitted when a user manually draws an edge between two nodes.
   *
   * This event only fires for user-initiated edge creation through the UI,
   * but not for programmatically added edges.
   */
  @Output() edgeDrawn = new EventEmitter<EdgeDrawnEvent>();

  /**
   * Event emitted when selected nodes are moved within the diagram.
   *
   * This event fires when the user moves nodes manually by dragging or
   * programmatically using the `NgDiagramNodeService.moveNodesBy()` method.
   */
  @Output() selectionMoved = new EventEmitter<SelectionMovedEvent>();

  /**
   * Event emitted when the selection state changes in the diagram.
   *
   * This event fires when the user selects or deselects nodes and edges through
   * clicking or programmatically using the `NgDiagramSelectionService`.
   */
  @Output() selectionChanged = new EventEmitter<SelectionChangedEvent>();

  /**
   * Event emitted when a selection gesture is complete.
   *
   * This event fires on pointerup after a selection operation completes —
   * whether from clicking a node/edge, box selection, or select-all.
   * Use this to trigger actions after the user finishes selecting,
   * such as showing toolbars, updating panels, or making API calls.
   */
  @Output() selectionGestureEnded = new EventEmitter<SelectionGestureEndedEvent>();

  /**
   * Event emitted when selected elements are deleted from the diagram.
   *
   * This event fires when the user deletes nodes and edges using the delete key,
   * or programmatically through the diagram service.
   */
  @Output() selectionRemoved = new EventEmitter<SelectionRemovedEvent>();

  /**
   * Event emitted when nodes are grouped or ungrouped.
   *
   * This event fires when the user moves nodes in or out of a group node,
   * changing their group membership status.
   */
  @Output() groupMembershipChanged = new EventEmitter<GroupMembershipChangedEvent>();

  /**
   * Event emitted when a node is rotated in the diagram.
   *
   * This event fires when the user rotates a node manually using the rotation handle
   * or programmatically using the `NgDiagramNodeService` rotation methods.
   */
  @Output() selectionRotated = new EventEmitter<SelectionRotatedEvent>();

  /**
   * Event emitted when a node rotation operation begins.
   *
   * This event fires once when the user starts rotating a node by dragging
   * the rotation handle.
   */
  @Output() nodeRotateStarted = new EventEmitter<NodeRotateStartedEvent>();

  /**
   * Event emitted when a node rotation operation ends.
   *
   * This event fires when the user releases the pointer after rotating a node.
   * The node will have its final angle when this event is received.
   */
  @Output() nodeRotateEnded = new EventEmitter<NodeRotateEndedEvent>();

  /**
   * Event emitted when the viewport changes through panning or zooming.
   *
   * This event fires during pan and zoom operations, including mouse wheel zoom,
   * and programmatic viewport changes.
   */
  @Output() viewportChanged = new EventEmitter<ViewportChangedEvent>();

  /**
   * Event emitted when clipboard content is pasted into the diagram.
   *
   * This event fires when nodes and edges are added via paste operations,
   * either through keyboard shortcuts or programmatic paste commands.
   */
  @Output() clipboardPasted = new EventEmitter<ClipboardPastedEvent>();

  /**
   * Event emitted when a node or group size changes.
   *
   * This event fires when a node is resized manually by dragging resize handles
   * or programmatically using resize methods.
   */
  @Output() nodeResized = new EventEmitter<NodeResizedEvent>();

  /**
   * Event emitted when a node resize operation begins.
   *
   * This event fires once when the user starts resizing a node by dragging
   * a resize handle.
   */
  @Output() nodeResizeStarted = new EventEmitter<NodeResizeStartedEvent>();

  /**
   * Event emitted when a node resize operation ends.
   *
   * This event fires when the user releases the pointer after resizing a node.
   * The node will have its final size when this event is received.
   */
  @Output() nodeResizeEnded = new EventEmitter<NodeResizeEndedEvent>();

  /**
   * Event emitted when a palette item is dropped onto the diagram.
   *
   * This event fires when users drag items from the palette and drop them
   * onto the canvas to create new nodes.
   */
  @Output() paletteItemDropped = new EventEmitter<PaletteItemDroppedEvent>();

  /**
   * Event emitted when a node drag operation begins.
   *
   * This event fires once when the drag threshold is crossed, signaling the
   * start of a drag operation.
   */
  @Output() nodeDragStarted = new EventEmitter<NodeDragStartedEvent>();

  /**
   * Event emitted when a node drag operation ends.
   *
   * This event fires when the user releases the pointer after dragging nodes.
   * Nodes will have their final positions when this event is received.
   */
  @Output() nodeDragEnded = new EventEmitter<NodeDragEndedEvent>();

  constructor() {
    effect(() => {
      const model = this.model();
      if (this.initializedModel != model) {
        // Angular 18 backward compatibility
        untracked(() => {
          this.renderer.isInitialized.set(false);
          this.renderer.viewportPannable.set(this.config()?.viewportPanningEnabled ?? true);
          this.flowCoreProvider.destroy();
          this.flowCoreProvider.init(
            model,
            this.middlewares(),
            this.getFlowOffset,
            this.getViewportSize,
            this.config()
          );
        });

        this.initializedModel = model;

        this.setupEventBridge();
      }
    });

    effect(() => {
      const nodeTemplateMap = this.nodeTemplateMap();
      this.templateProviderService.setNodeTemplateMap(nodeTemplateMap);
    });

    effect(() => {
      const edgeTemplateMap = this.edgeTemplateMap();
      this.templateProviderService.setEdgeTemplateMap(edgeTemplateMap);
    });
  }

  /** @ignore */
  ngOnInit(): void {
    this.flowResizeBatchProcessor.initialize();
    this.setupViewportSizeTracking();
  }

  /** @ignore */
  ngOnDestroy(): void {
    this.flowCoreProvider.destroy();
    this.cleanupViewportSizeTracking();
  }

  /**
   * Retrieves the custom Angular component template for rendering a specific node type.
   *
   * This method performs a lookup in the node template map to find a custom component
   * for the given node type. If no custom template is registered, it returns null,
   * which will cause the diagram to fall back to the default node template.
   *
   * @param nodeType - The type identifier of the node to get a template for.
   *
   * @returns The Angular component class registered for the node type, or
   * null if no custom template is registered for this type
   *
   * @example
   * Basic usage in template:
   * ```typescript
   * // In your component
   * const nodeTemplates = new Map([
   *   ['database', DatabaseNodeComponent],
   *   ['api', ApiNodeComponent]
   * ]);
   *
   * // The method will return DatabaseNodeComponent for database nodes
   * const dbTemplate = this.getNodeTemplate('database'); // Returns DatabaseNodeComponent
   * ```
   * @see {@link nodeTemplateMap} - The input property where templates are registered
   * @see {@link NgDiagramNodeTemplateMap} - Type definition for the template map
   *
   * @throws This method does not throw exceptions - it handles all edge cases gracefully
   */
  getNodeTemplate(nodeType: Node['type']) {
    return this.templateProviderService.getNodeTemplate(nodeType);
  }

  getEdgeTemplate(edgeType: Edge['type']) {
    return this.templateProviderService.getEdgeTemplate(edgeType);
  }

  // Used by template @for track function to force view recreation after delete/re-add
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trackNode = (_index: number, node: Node) => (node as any)._internalId || node.id;

  isGroup(node: Node) {
    return 'isGroup' in node;
  }

  castToGroupNode(node: Node) {
    return node as GroupNode;
  }

  getBoundingClientRect() {
    return this.elementRef.nativeElement.getBoundingClientRect();
  }

  private getFlowOffset = () => {
    const clientRect = this.elementRef.nativeElement.getBoundingClientRect();
    return clientRect ? { x: clientRect.left, y: clientRect.top } : { x: 0, y: 0 };
  };

  private getViewportSize = () => {
    const clientRect = this.elementRef.nativeElement.getBoundingClientRect();
    return clientRect ? { width: clientRect.width, height: clientRect.height } : { width: 0, height: 0 };
  };

  private setupViewportSizeTracking(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        this.updateViewportSize(width, height);
      }
    });

    this.resizeObserver.observe(this.elementRef.nativeElement);

    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    this.updateViewportSize(rect.width, rect.height);
  }

  private cleanupViewportSizeTracking(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  private updateViewportSize(width: number, height: number): void {
    if (!this.flowCoreProvider.isInitialized()) {
      return;
    }

    const flowCore = this.flowCoreProvider.provide();
    const currentMetadata = flowCore.getState().metadata;
    const currentViewport = currentMetadata.viewport;

    if (currentViewport.width !== width || currentViewport.height !== height) {
      flowCore.applyUpdate(
        {
          metadataUpdate: {
            viewport: {
              ...currentViewport,
              width,
              height,
            },
          },
        },
        'updateViewportSize'
      );
    }
  }

  private setupEventBridge(): void {
    const flowCore = this.flowCoreProvider.provide();
    const eventManager = flowCore.eventManager;

    eventManager.on('diagramInit', (event) => {
      setTimeout(() => {
        this.renderer.isInitialized.set(true);
        this.diagramInit.emit(event);

        if (flowCore.config.zoom.zoomToFit.onInit) {
          flowCore.commandHandler.emit('zoomToFit', {});
        }
      });
    });

    eventManager.on('edgeDrawn', (event) => this.edgeDrawn.emit(event));
    eventManager.on('selectionMoved', (event) => this.selectionMoved.emit(event));
    eventManager.on('selectionChanged', (event) => this.selectionChanged.emit(event));
    eventManager.on('selectionGestureEnded', (event) => this.selectionGestureEnded.emit(event));
    eventManager.on('selectionRemoved', (event) => this.selectionRemoved.emit(event));
    eventManager.on('groupMembershipChanged', (event) => this.groupMembershipChanged.emit(event));
    eventManager.on('selectionRotated', (event) => this.selectionRotated.emit(event));
    eventManager.on('nodeRotateStarted', (event) => this.nodeRotateStarted.emit(event));
    eventManager.on('nodeRotateEnded', (event) => this.nodeRotateEnded.emit(event));
    eventManager.on('viewportChanged', (event) => this.viewportChanged.emit(event));
    eventManager.on('clipboardPasted', (event) => this.clipboardPasted.emit(event));
    eventManager.on('nodeResized', (event) => this.nodeResized.emit(event));
    eventManager.on('nodeResizeStarted', (event) => this.nodeResizeStarted.emit(event));
    eventManager.on('nodeResizeEnded', (event) => this.nodeResizeEnded.emit(event));
    eventManager.on('paletteItemDropped', (event) => this.paletteItemDropped.emit(event));
    eventManager.on('nodeDragStarted', (event) => this.nodeDragStarted.emit(event));
    eventManager.on('nodeDragEnded', (event) => this.nodeDragEnded.emit(event));
  }
}
