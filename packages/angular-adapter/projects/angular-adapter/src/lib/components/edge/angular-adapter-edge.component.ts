import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Edge } from '@angularflow/core';
import {
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerUpEventListenerDirective,
  ZIndexDirective,
} from '../../directives';
import { ObjectSelectDirective } from '../../directives/__new__input-events/object-select/object-select.directive';

@Component({
  selector: 'angular-adapter-edge',
  templateUrl: './angular-adapter-edge.component.html',
  styleUrl: './angular-adapter-edge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    // { directive: PointerDownEventListenerDirective, inputs: ['eventTarget'] },
    { directive: PointerEnterEventListenerDirective, inputs: ['eventTarget'] },
    { directive: PointerLeaveEventListenerDirective, inputs: ['eventTarget'] },
    { directive: PointerUpEventListenerDirective, inputs: ['eventTarget'] },
    { directive: ZIndexDirective, inputs: ['data'] },
    { directive: ObjectSelectDirective, inputs: ['selectTargetData: data', 'selectTargetType'] },
  ],
})
export class AngularAdapterEdgeComponent {
  data = input.required<Edge>();
}
