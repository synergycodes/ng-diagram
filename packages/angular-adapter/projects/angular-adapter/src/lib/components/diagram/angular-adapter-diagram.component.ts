import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, input, OnDestroy } from '@angular/core';
import { Edge, Node } from '@angularflow/core';

import { CursorPositionTrackerDirective } from '../../directives/cursor-position-tracker/cursor-position-tracker.directive';
import { KeyboardInputsDirective } from '../../directives/input-events/keyboard-inputs/keyboard-inputs.directive';
import { PaletteDropDirective } from '../../directives/input-events/palette-drop/palette-drop.directive';
import { PanningDirective } from '../../directives/input-events/panning/panning.directive';
import { ZoomingPointerDirective } from '../../directives/input-events/zooming/zooming-pointer.directive';
import { ZoomingWheelDirective } from '../../directives/input-events/zooming/zooming-wheel.directive';
import { DIAGRAM_CONFIG, MIDDLEWARES, MODEL } from '../../ng-diagram.module';
import { FlowCoreProviderService, FlowResizeBatchProcessorService, RendererService } from '../../services';
import { EdgeTemplateMap, NodeTemplateMap } from '../../types';
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
export class AngularAdapterDiagramComponent implements OnDestroy {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly renderer = inject(RendererService);
  private readonly flowResizeBatchProcessor = inject(FlowResizeBatchProcessorService);
  private readonly config = inject(DIAGRAM_CONFIG);
  private readonly middlewares = inject(MIDDLEWARES);
  private readonly model = inject(MODEL);

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
    this.getFlowOffset = this.getFlowOffset.bind(this);

    this.flowCoreProvider.init(this.model, this.middlewares, this.getFlowOffset, this.config);
    // Initialize the resize batch processor after FlowCore is ready
    this.flowResizeBatchProcessor.initialize();
  }

  ngOnDestroy(): void {
    this.flowCoreProvider.destroy();
  }

  getFlowOffset() {
    const clientRect = this.elementRef.nativeElement.getBoundingClientRect();
    return clientRect ? { x: clientRect.left, y: clientRect.top } : { x: 0, y: 0 };
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
}
