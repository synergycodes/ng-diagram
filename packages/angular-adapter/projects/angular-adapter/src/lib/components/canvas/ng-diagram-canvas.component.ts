import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ViewportDirective } from '../../directives';
import { ObjectSelectDirective } from '../../directives/input-events/object-select/object-select.directive';

@Component({
  selector: 'ng-diagram-canvas',
  templateUrl: './ng-diagram-canvas.component.html',
  styleUrl: './ng-diagram-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: ViewportDirective, inputs: ['viewport'] },
    { directive: ObjectSelectDirective, inputs: ['targetData', 'targetType'] },
  ],
})
export class NgDiagramCanvasComponent {}
