import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { Edge, ModelAdapter, Node } from '@angularflow/core';

import {
  KeyDownEventListenerDirective,
  KeyPressEventListenerDirective,
  KeyUpEventListenerDirective,
  PointerDownEventListenerDirective,
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerMoveEventListenerDirective,
  PointerUpEventListenerDirective,
} from '../../directives';
import { FlowCoreProviderService, ModelProviderService, RendererService } from '../../services';
import { EdgeTemplateMap, NodeTemplateMap } from '../../types';
import { AngularAdapterCanvasComponent } from '../canvas/angular-adapter-canvas.component';
import { AngularAdapterEdgeComponent } from '../edge/angular-adapter-edge.component';
import { EdgeStraightComponent } from '../edge/edge-straight/edge-straight.component';
import { MarkerArrowComponent } from '../edge/markers/marker-arrow.component';
import { AngularAdapterNodeComponent } from '../node/angular-adapter-node.component';

@Component({
  selector: 'angular-adapter-diagram',
  imports: [
    CommonModule,
    AngularAdapterCanvasComponent,
    AngularAdapterNodeComponent,
    AngularAdapterEdgeComponent,
    EdgeStraightComponent,
    MarkerArrowComponent,
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
  ],
})
export class AngularAdapterDiagramComponent {
  private readonly modelProvider = inject(ModelProviderService);
  private readonly flowCore = inject(FlowCoreProviderService);
  private readonly renderer = inject(RendererService);
  /**
   * The model to use in the diagram.
   */
  model = input.required<ModelAdapter>();

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
        this.modelProvider.init(this.model());
        this.flowCore.init();
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
