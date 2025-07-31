import { ChangeDetectionStrategy, Component } from '@angular/core';

import { DiagramSelectionDirective, ViewportDirective } from '../../directives';

@Component({
  selector: 'angular-adapter-canvas',
  templateUrl: './angular-adapter-canvas.component.html',
  styleUrl: './angular-adapter-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: ViewportDirective, inputs: ['viewport'] },
    { directive: DiagramSelectionDirective, inputs: ['targetData'] },
  ],
})
export class AngularAdapterCanvasComponent {}
