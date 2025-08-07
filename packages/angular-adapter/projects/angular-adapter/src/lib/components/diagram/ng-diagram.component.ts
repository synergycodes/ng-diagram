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
  signal,
} from '@angular/core';
import { Edge, Node } from '@angularflow/core';

import type {
  FlowCore,
  Metadata,
  MiddlewareChain,
  MiddlewaresConfigFromMiddlewares,
  ModelAdapter,
} from '@angularflow/core';

import { CursorPositionTrackerDirective } from '../../directives/cursor-position-tracker/cursor-position-tracker.directive';
import { KeyboardInputsDirective } from '../../directives/input-events/keyboard-inputs/keyboard-inputs.directive';
import { PaletteDropDirective } from '../../directives/input-events/palette-drop/palette-drop.directive';
import { PanningDirective } from '../../directives/input-events/panning/panning.directive';
import { ZoomingPointerDirective } from '../../directives/input-events/zooming/zooming-pointer.directive';
import { ZoomingWheelDirective } from '../../directives/input-events/zooming/zooming-wheel.directive';
import { FlowCoreProviderService, FlowResizeBatchProcessorService, RendererService } from '../../services';
import { NgDiagramConfig, NgDiagramEdgeTemplateMap, NgDiagramNodeTemplateMap } from '../../types';
import { BUILTIN_MIDDLEWARES } from '../../utils/create-middlewares';
import { NgDiagramBackgroundComponent } from '../background/ng-diagram-background.component';
import { NgDiagramCanvasComponent } from '../canvas/ng-diagram-canvas.component';
import { NgDiagramDefaultEdgeComponent } from '../edge/default-edge/default-edge.component';
import { NgDiagramMarkerArrowComponent } from '../edge/markers/marker-arrow.component';
import { NgDiagramEdgeComponent } from '../edge/ng-diagram-edge.component';
import { NgDiagramDefaultGroupTemplateComponent } from '../node/default-group-template/ng-diagram-default-group-template.component';
import { NgDiagramDefaultNodeTemplateComponent } from '../node/default-node-template/ng-diagram-default-node-template.component';
import { NgDiagramNodeComponent } from '../node/ng-diagram-node.component';

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
    NgDiagramBackgroundComponent,
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
  ],
})
export class NgDiagramComponent<
    TMiddlewares extends MiddlewareChain = [],
    TAdapter extends ModelAdapter<Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>>> = ModelAdapter<
      Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>>
    >,
  >
  implements OnInit, OnDestroy
{
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly renderer = inject(RendererService);
  private readonly flowResizeBatchProcessor = inject(FlowResizeBatchProcessorService);

  private flowCore = signal<FlowCore | undefined>(undefined);

  private initializedModel: TAdapter | null = null;
  private resizeObserver: ResizeObserver | null = null;

  /**
   * Global configuration options for the diagram.
   */
  config = input<NgDiagramConfig>();

  /**
   * The model to use in the diagram.
   */
  model = input.required<TAdapter>();

  /**
   * Optional — the initial middlewares to use.
   * When provided, the middleware list can be modified to add new items,
   * replace existing ones, or override the defaults.
   *
   * ⚠️ Use with caution — incorrectly implemented custom middlewares
   * can degrade performance or completely break the data flow.
   */
  middlewares = input<TMiddlewares>(BUILTIN_MIDDLEWARES as unknown as TMiddlewares);

  /**
   * The node template map to use for the diagram.
   */
  nodeTemplateMap = input<NgDiagramNodeTemplateMap>(new Map());

  /**
   * The edge template map to use for the diagram.
   * Optional - if not provided, default edge rendering will be used.
   */
  edgeTemplateMap = input<NgDiagramEdgeTemplateMap>(new Map());

  /**
   * Enables or disables debug mode for the diagram.
   * When enabled, additional console logs are printed.
   */
  debugMode = input<boolean>(false);

  nodes = this.renderer.nodes;
  edges = this.renderer.edges;
  viewport = this.renderer.viewport;

  constructor() {
    effect(() => {
      const model = this.model();
      if (this.initializedModel != model) {
        this.flowCoreProvider.destroy();
        this.flowCoreProvider.init(model, this.middlewares(), this.getFlowOffset, this.config());

        this.flowCore.set(this.flowCoreProvider.provide());

        this.initializedModel = model;
      }
    });

    effect(() => {
      const flowCore = this.flowCore();
      if (!flowCore) {
        return;
      }

      flowCore.setDebugMode(this.debugMode());
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
    const flowCore = this.flowCore();
    if (!flowCore) {
      return;
    }

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
