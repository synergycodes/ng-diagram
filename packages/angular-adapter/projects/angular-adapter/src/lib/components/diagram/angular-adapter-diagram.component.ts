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

import { CursorPositionTrackerDirective } from '../../directives/cursor-position-tracker/cursor-position-tracker.directive';
import { KeyboardInputsDirective } from '../../directives/input-events/keyboard-inputs/keyboard-inputs.directive';
import { PaletteDropDirective } from '../../directives/input-events/palette-drop/palette-drop.directive';
import { PanningDirective } from '../../directives/input-events/panning/panning.directive';
import { ZoomingPointerDirective } from '../../directives/input-events/zooming/zooming-pointer.directive';
import { ZoomingWheelDirective } from '../../directives/input-events/zooming/zooming-wheel.directive';
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
> {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly renderer = inject(RendererService);
  private readonly flowResizeBatchProcessor = inject(FlowResizeBatchProcessorService);
  private readonly host: ElementRef;

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

  constructor(host: ElementRef) {
    this.host = host;
    this.getFlowOffset = this.getFlowOffset.bind(this);

    // this effect was run every time nodes, edges or metadata changed - signals implementation of modelAdapter causes this?
    // To fix this behavior we need to destroy the effect after the first run
    const effectRef = effect(
      () => {
        // Bind getOffset once in the constructor and reuse the reference
        this.flowCoreProvider.init(this.model(), this.middlewares(), this.getFlowOffset);
        // Initialize the resize batch processor after FlowCore is ready
        this.flowResizeBatchProcessor.initialize();
        effectRef.destroy();
      },
      { manualCleanup: true }
    );
  }

  getFlowOffset() {
    const clientRect = this.host.nativeElement?.getBoundingClientRect();
    return clientRect ? { x: clientRect.left, y: clientRect.top } : { x: 0, y: 0 };
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
}
