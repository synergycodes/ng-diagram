import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ViewportDirective } from '../../directives';

@Component({
  selector: 'ng-diagram-canvas',
  templateUrl: './ng-diagram-canvas.component.html',
  styleUrl: './ng-diagram-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: ViewportDirective, inputs: ['viewport'] }],
})
export class NgDiagramCanvasComponent {}
