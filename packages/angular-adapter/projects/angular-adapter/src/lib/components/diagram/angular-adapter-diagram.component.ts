import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { Edge, Middleware, ModelAdapter, Node } from '@angularflow/core';

import {
  KeyDownEventListenerDirective,
  KeyPressEventListenerDirective,
  KeyUpEventListenerDirective,
  PointerDownEventListenerDirective,
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerMoveEventListenerDirective,
  PointerUpEventListenerDirective,
  WheelEventListenerDirective,
} from '../../directives';
import { FlowCoreProviderService, RendererService } from '../../services';
import { EdgeTemplateMap, NodeTemplateMap } from '../../types';
import { AngularAdapterCanvasComponent } from '../canvas/angular-adapter-canvas.component';
import { AngularAdapterEdgeComponent } from '../edge/angular-adapter-edge.component';
import { MarkerArrowComponent } from '../edge/markers/marker-arrow.component';
import { AngularAdapterNodeComponent } from '../node/angular-adapter-node.component';
import { ToolbarComponent } from '../toolbar/angular-adapter-toolbar';

@Component({
  selector: 'angular-adapter-diagram',
  imports: [
    CommonModule,
    AngularAdapterCanvasComponent,
    AngularAdapterNodeComponent,
    AngularAdapterEdgeComponent,
    MarkerArrowComponent,
    ToolbarComponent,
  ],
  templateUrl: './angular-adapter-diagram.component.html',
  styleUrl: './angular-adapter-diagram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    PointerDownEventListenerDirective,
    PointerEnterEventListenerDirective,
    PointerLeaveEventListenerDirective,
    PointerMoveEventListenerDirective,
    PointerUpEventListenerDirective,
    KeyDownEventListenerDirective,
    KeyUpEventListenerDirective,
    KeyPressEventListenerDirective,
    WheelEventListenerDirective,
  ],
})
export class AngularAdapterDiagramComponent {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly renderer = inject(RendererService);
  /**
   * The model to use in the diagram.
   */
  model = input.required<ModelAdapter>();

  /**
   * The starting middlewares to use in the Flow Core.
   */
  middlewares = input<Middleware[]>([]);

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
}
