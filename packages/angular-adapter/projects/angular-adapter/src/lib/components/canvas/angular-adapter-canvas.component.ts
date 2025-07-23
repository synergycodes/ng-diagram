import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ViewportDirective } from '../../directives';
import { ObjectSelectDirective } from '../../directives/input-events/object-select/object-select.directive';

@Component({
  selector: 'angular-adapter-canvas',
  templateUrl: './angular-adapter-canvas.component.html',
  styleUrl: './angular-adapter-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: ViewportDirective, inputs: ['viewport'] },
    { directive: ObjectSelectDirective, inputs: ['targetData', 'targetType'] },
  ],
})
export class AngularAdapterCanvasComponent {}
