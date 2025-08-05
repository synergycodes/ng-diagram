import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Edge, Node } from '@angularflow/core';
import { DiagramSelectionDirective, ViewportDirective } from '../../directives';

@Component({
  selector: 'ng-diagram-canvas',
  templateUrl: './ng-diagram-canvas.component.html',
  styleUrl: './ng-diagram-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: ViewportDirective, inputs: ['viewport'] },
    { directive: DiagramSelectionDirective, inputs: ['targetData'] },
  ],
})
export class NgDiagramCanvasComponent {
  targetData = input.required<Node | Edge | undefined>();
}
