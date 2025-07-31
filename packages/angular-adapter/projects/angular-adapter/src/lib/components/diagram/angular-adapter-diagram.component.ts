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
  DeepPartial,
  FlowConfig,
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
import { NgDiagramEdgeTemplateMap, NgDiagramNodeTemplateMap } from '../../types';
import { BUILTIN_MIDDLEWARES } from '../../utils/create-middlewares';
import { AngularAdapterCanvasComponent } from '../canvas/angular-adapter-canvas.component';
import { AngularAdapterEdgeComponent } from '../edge/angular-adapter-edge.component';
import { DefaultEdgeComponent } from '../edge/default-edge/default-edge.component';
import { MarkerArrowComponent } from '../edge/markers/marker-arrow.component';
import { AngularAdapterNodeComponent } from '../node/angular-adapter-node.component';
import { DefaultGroupTemplateComponent } from '../node/default-group-template/default-group-template.component';
import { DefaultNodeTemplateComponent } from '../node/default-node-template/default-node-template.component';

@Component({
  selector: 'angular-adapter-diagram',
  imports: [
    CommonModule,
    AngularAdapterCanvasComponent,
    AngularAdapterNodeComponent,
    AngularAdapterEdgeComponent,
    MarkerArrowComponent,
    DefaultEdgeComponent,
    DefaultNodeTemplateComponent,
    DefaultGroupTemplateComponent,
  ],
  templateUrl: './angular-adapter-diagram.component.html',
  styleUrl: './angular-adapter-diagram.component.scss',
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
export class AngularAdapterDiagramComponent<
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

  private initializedModel: TAdapter | null = null;

  config = input<DeepPartial<FlowConfig>>();

  /**
   * The model to use in the diagram.
   */
  model = input.required<TAdapter>();

  /**
   * The starting middlewares to use in the Flow Core.
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

  debugMode = input<boolean>(false);

  nodes = this.renderer.nodes;
  edges = this.renderer.edges;
  viewport = this.renderer.viewport;

  private flowCore = signal<FlowCore | undefined>(undefined);

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

    const flowCore = this.flowCoreProvider.provide();
    this.flowCore.set(flowCore);

    effect(() => {
      const flowCore = this.flowCore();
      if (!flowCore) {
        return;
      }

      flowCore.setDebugMode(this.debugMode());
    });
  }

  ngOnDestroy(): void {
    this.flowCoreProvider.destroy();
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

  private getFlowOffset = () => {
    const clientRect = this.elementRef.nativeElement.getBoundingClientRect();
    return clientRect ? { x: clientRect.left, y: clientRect.top } : { x: 0, y: 0 };
  };
}
