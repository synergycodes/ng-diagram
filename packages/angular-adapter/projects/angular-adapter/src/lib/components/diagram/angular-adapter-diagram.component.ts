import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { ModelAdapter, Node } from '@angularflow/core';

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
import { FlowCoreProviderService, ModelProviderService } from '../../services';
import { NodeTemplateMap } from '../../types';
import { AngularAdapterCanvasComponent } from '../canvas/angular-adapter-canvas.component';
import { AngularAdapterNodeComponent } from '../node/angular-adapter-node.component';

@Component({
  selector: 'angular-adapter-diagram',
  imports: [CommonModule, AngularAdapterCanvasComponent, AngularAdapterNodeComponent],
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
  /**
   * The nodes to display in the diagram.
   */
  model = input.required<ModelAdapter>();

  /**
   * The node template map to use for the diagram.
   */
  nodeTemplateMap = input<NodeTemplateMap>(new Map());

  nodes = computed(() => this.model().getNodes());

  constructor() {
    effect(() => {
      this.modelProvider.init(this.model());
      this.flowCore.init();
    });
  }

  getNodeTemplate(nodeType: Node['type']) {
    return this.nodeTemplateMap().get(nodeType) ?? null;
  }
}
