import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ViewportDirective } from '../../directives';

@Component({
  selector: 'angular-adapter-canvas',
  templateUrl: './angular-adapter-canvas.component.html',
  styleUrl: './angular-adapter-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: ViewportDirective, inputs: ['viewport'] }],
})
export class AngularAdapterCanvasComponent {}
