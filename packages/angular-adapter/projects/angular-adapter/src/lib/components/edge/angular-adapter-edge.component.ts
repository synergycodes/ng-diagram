import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  PointerDownEventListenerDirective,
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerUpEventListenerDirective,
} from '../../directives';

@Component({
  selector: 'angular-adapter-edge',
  templateUrl: './angular-adapter-edge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
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
export class AngularAdapterEdgeComponent {}
