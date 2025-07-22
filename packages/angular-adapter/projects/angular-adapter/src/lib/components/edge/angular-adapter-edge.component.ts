import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Edge } from '@angularflow/core';

import { ZIndexDirective } from '../../directives';
import { ObjectSelectDirective } from '../../directives/input-events/object-select/object-select.directive';

@Component({
  selector: 'angular-adapter-edge',
  templateUrl: './angular-adapter-edge.component.html',
  styleUrl: './angular-adapter-edge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: ZIndexDirective, inputs: ['data'] },
    { directive: ObjectSelectDirective, inputs: ['targetData: data', 'targetType'] },
  ],
})
export class AngularAdapterEdgeComponent {
  data = input.required<Edge>();
}
