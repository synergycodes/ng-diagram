import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  NodePositionDirective,
  PointerDownEventListenerDirective,
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerUpEventListenerDirective,
} from '../../directives';

@Component({
  selector: 'angular-adapter-node',
  templateUrl: './angular-adapter-node.component.html',
  styleUrl: './angular-adapter-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: NodePositionDirective,
      inputs: ['position'],
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
