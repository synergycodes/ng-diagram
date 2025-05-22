import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Node } from '@angularflow/core';

import {
  NodePositionDirective,
  NodeSelectedDirective,
  NodeSizeDirective,
  PointerDownEventListenerDirective,
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerUpEventListenerDirective,
  ZIndexDirective,
} from '../../directives';
import { NodeResizeAdornmentComponent } from './resize/node-resize-adornment.component';

@Component({
  selector: 'angular-adapter-node',
  templateUrl: './angular-adapter-node.component.html',
  styleUrl: './angular-adapter-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: NodeSizeDirective, inputs: ['data'] },
    { directive: NodePositionDirective, inputs: ['data'] },
    { directive: NodeSelectedDirective, inputs: ['data'] },
    { directive: PointerDownEventListenerDirective, inputs: ['eventTarget'] },
    { directive: PointerEnterEventListenerDirective, inputs: ['eventTarget'] },
    { directive: PointerLeaveEventListenerDirective, inputs: ['eventTarget'] },
    { directive: PointerUpEventListenerDirective, inputs: ['eventTarget'] },
    { directive: ZIndexDirective, inputs: ['data'] },
  ],
  imports: [NodeResizeAdornmentComponent],
})
export class AngularAdapterNodeComponent {
  data = input.required<Node>();
}
