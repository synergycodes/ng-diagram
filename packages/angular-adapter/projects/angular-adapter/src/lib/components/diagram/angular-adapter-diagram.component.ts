import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, input } from '@angular/core';
import {
  Edge,
  Metadata,
  MiddlewareChain,
  MiddlewaresConfigFromMiddlewares,
  ModelAdapter,
  Node,
} from '@angularflow/core';

import { KeyboardInputsDirective } from '../../directives/__new__input-events/keyboard-inputs/keyboard-inputs.directive';
import { __NEW__PanningDirective } from '../../directives/__new__input-events/panning/panning.directive';
import { ZoomingDirective } from '../../directives/__new__input-events/zooming/zooming.directive';
import { FlowCoreProviderService, FlowResizeBatchProcessorService, RendererService } from '../../services';
import { EdgeTemplateMap, NodeTemplateMap } from '../../types';
import { AngularAdapterCanvasComponent } from '../canvas/angular-adapter-canvas.component';
import { AngularAdapterEdgeComponent } from '../edge/angular-adapter-edge.component';
import { DefaultEdgeComponent } from '../edge/default-edge/default-edge.component';
import { MarkerArrowComponent } from '../edge/markers/marker-arrow.component';
import { AngularAdapterNodeComponent } from '../node/angular-adapter-node.component';

@Component({
  selector: 'angular-adapter-diagram',
  imports: [
    CommonModule,
    AngularAdapterCanvasComponent,
    AngularAdapterNodeComponent,
    AngularAdapterEdgeComponent,
    MarkerArrowComponent,
    DefaultEdgeComponent,
  ],
  templateUrl: './angular-adapter-diagram.component.html',
  styleUrl: './angular-adapter-diagram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    __NEW__PanningDirective,
    KeyboardInputsDirective,
    ZoomingDirective,
    // PointerDownEventListenerDirective,
    // PointerEnterEventListenerDirective,
    // PointerLeaveEventListenerDirective,
    // PointerMoveEventListenerDirective,
    // PointerUpEventListenerDirective,
    // KeyDownEventListenerDirective,
    // KeyUpEventListenerDirective,
    // KeyPressEventListenerDirective,
    // WheelEventListenerDirective,
  ],
})
export class AngularAdapterDiagramComponent<
  TMiddlewares extends MiddlewareChain = [],
  TAdapter extends ModelAdapter<Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>>> = ModelAdapter<
    Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>>
  >,
> {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly renderer = inject(RendererService);
  private readonly flowResizeBatchProcessor = inject(FlowResizeBatchProcessorService);
  /**
   * The model to use in the diagram.
   */
  model = input.required<TAdapter>();

  /**
   * The starting middlewares to use in the Flow Core.
   */
  middlewares = input<TMiddlewares>([] as unknown as TMiddlewares);

  /**
   * The node template map to use for the diagram.
   */
  nodeTemplateMap = input<NodeTemplateMap>(new Map());

  /**
   * The edge template map to use for the diagram.
   * Optional - if not provided, default edge rendering will be used.
   */
  edgeTemplateMap = input<EdgeTemplateMap>(new Map());

  nodes = this.renderer.nodes;
  edges = this.renderer.edges;
  viewport = this.renderer.viewport;

  constructor() {
    // this effect was run every time nodes, edges or metadata changed - signals implementation of modelAdapter causes this?
    // To fix this behavior we need to destroy the effect after the first run
    const effectRef = effect(
      () => {
        this.flowCoreProvider.init(this.model(), this.middlewares());
        // Initialize the resize batch processor after FlowCore is ready
        this.flowResizeBatchProcessor.initialize();
        effectRef.destroy();
      },
      { manualCleanup: true }
    );
  }

  getNodeTemplate(nodeType: Node['type']) {
    return this.nodeTemplateMap().get(nodeType) ?? null;
  }

  getEdgeTemplate(edgeType: Edge['type']) {
    if (!edgeType) {
      return null;
    }
    return this.edgeTemplateMap().get(edgeType) ?? null;
  }

  getNativeElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }
}
