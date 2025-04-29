import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Node } from '@angularflow/core';

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
  /**
   * The nodes to display in the diagram.
   */
  nodes = input<Node[]>([]);

  /**
   * The node template map to use for the diagram.
   */
  nodeTemplateMap = input<NodeTemplateMap>(new Map());

  getNodeTemplate(nodeType: Node['type']) {
    return this.nodeTemplateMap().get(nodeType) ?? null;
  }
}
