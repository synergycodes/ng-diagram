import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  NodePositionDirective,
  PointerDownEventListenerDirective,
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerUpEventListenerDirective,
} from '../../directives';
import { NodeSelectedDirective } from '../../directives/node-selected/node-selected.directive';
import { NodeSizeDirective } from '../../directives/node-size/node-size.directive';

@Component({
  selector: 'angular-adapter-node',
  templateUrl: './angular-adapter-node.component.html',
  styleUrl: './angular-adapter-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: NodeSizeDirective,
      inputs: ['eventTarget', 'size', 'sizeControlled'],
    },
    {
      directive: NodePositionDirective,
      inputs: ['position'],
    },
    {
      directive: NodeSelectedDirective,
      inputs: ['selected'],
    },
    {
      directive: PointerDownEventListenerDirective,
      inputs: ['eventTarget'],
    },
    {
      directive: PointerEnterEventListenerDirective,
      inputs: ['eventTarget'],
    },
    {
      directive: PointerLeaveEventListenerDirective,
      inputs: ['eventTarget'],
    },
    {
      directive: PointerUpEventListenerDirective,
      inputs: ['eventTarget'],
    },
  ],
})
export class AngularAdapterNodeComponent {}
