import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Edge, Node } from '@angularflow/core';

import type { MiddlewareChain, ModelAdapter } from '@angularflow/core';

import { DiagramSelectionDirective } from '../../directives';
import { CursorPositionTrackerDirective } from '../../directives/cursor-position-tracker/cursor-position-tracker.directive';
import { KeyboardInputsDirective } from '../../directives/input-events/keyboard-inputs/keyboard-inputs.directive';
import { PaletteDropDirective } from '../../directives/input-events/palette-drop/palette-drop.directive';
import { PanningDirective } from '../../directives/input-events/panning/panning.directive';
import { ZoomingPointerDirective } from '../../directives/input-events/zooming/zooming-pointer.directive';
import { ZoomingWheelDirective } from '../../directives/input-events/zooming/zooming-wheel.directive';
import { FlowCoreProviderService, FlowResizeBatchProcessorService, RendererService } from '../../services';
import { NgDiagramConfig, NgDiagramEdgeTemplateMap, NgDiagramNodeTemplateMap } from '../../types';
import { BUILTIN_MIDDLEWARES } from '../../utils/create-middlewares';
import { NgDiagramCanvasComponent } from '../canvas/ng-diagram-canvas.component';
import { NgDiagramDefaultEdgeComponent } from '../edge/default-edge/default-edge.component';
import { NgDiagramMarkerArrowComponent } from '../edge/markers/marker-arrow.component';
import { NgDiagramEdgeComponent } from '../edge/ng-diagram-edge.component';
import { NgDiagramDefaultGroupTemplateComponent } from '../node/default-group-template/ng-diagram-default-group-template.component';
import { NgDiagramDefaultNodeTemplateComponent } from '../node/default-node-template/ng-diagram-default-node-template.component';
import { NgDiagramNodeComponent } from '../node/ng-diagram-node.component';

/**
 * Diagram component
 * @category Components
 */
@Component({
  selector: 'ng-diagram',
  imports: [
    CommonModule,
    NgDiagramCanvasComponent,
    NgDiagramNodeComponent,
    NgDiagramMarkerArrowComponent,
    NgDiagramDefaultEdgeComponent,
    NgDiagramDefaultNodeTemplateComponent,
    NgDiagramDefaultGroupTemplateComponent,
    NgDiagramEdgeComponent,
  ],
  templateUrl: './ng-diagram.component.html',
  styleUrl: './ng-diagram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    CursorPositionTrackerDirective,
    ZoomingPointerDirective,
    ZoomingWheelDirective,
    PanningDirective,
    KeyboardInputsDirective,
    PaletteDropDirective,
    DiagramSelectionDirective,
  ],
})
export class NgDiagramComponent implements OnInit, OnDestroy {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly renderer = inject(RendererService);
  private readonly flowResizeBatchProcessor = inject(FlowResizeBatchProcessorService);

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

  nodes = this.renderer.nodes;
  edges = this.renderer.edges;
  viewport = this.renderer.viewport;

  constructor() {
    effect(() => {
      const model = this.model();
      if (this.initializedModel != model) {
        this.flowCoreProvider.destroy();
        this.flowCoreProvider.init(model, this.middlewares(), this.getFlowOffset, this.config());

        this.initializedModel = model;
      }
    });
  }

  ngOnInit(): void {
    this.flowResizeBatchProcessor.initialize();
    this.setupViewportSizeTracking();
  }

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
    return this.nodeTemplateMap().get(nodeType || '') ?? null;
  }

  getEdgeTemplate(edgeType: Edge['type']) {
    if (!edgeType) {
      return null;
    }
    return this.edgeTemplateMap().get(edgeType) ?? null;
  }

  isGroup(node: Node) {
    return 'isGroup' in node;
  }

  getBoundingClientRect() {
    return this.elementRef.nativeElement.getBoundingClientRect();
  }

  private getFlowOffset = () => {
    const clientRect = this.elementRef.nativeElement.getBoundingClientRect();
    return clientRect ? { x: clientRect.left, y: clientRect.top } : { x: 0, y: 0 };
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
}
