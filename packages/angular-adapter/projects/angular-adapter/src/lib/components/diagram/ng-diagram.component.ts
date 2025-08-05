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
import { NgDiagramCanvasComponent } from '../canvas/ng-diagram-canvas.component';
import { NgDiagramBaseEdgeComponent } from '../edge/base-edge/base-edge.component';
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
    NgDiagramBaseEdgeComponent,
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

  getBoundingClientRect() {
    return this.elementRef.nativeElement.getBoundingClientRect();
  }

  private getFlowOffset = () => {
    const clientRect = this.elementRef.nativeElement.getBoundingClientRect();
    return clientRect ? { x: clientRect.left, y: clientRect.top } : { x: 0, y: 0 };
  };
}
