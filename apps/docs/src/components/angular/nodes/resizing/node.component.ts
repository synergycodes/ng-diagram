import { Component, input } from '@angular/core';
import {
  NgDiagramNodeResizeAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  type NgDiagramNodeTemplate,
  type Node,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'node',
  imports: [NgDiagramNodeResizeAdornmentComponent],
  template: `
    <ng-diagram-node-resize-adornment>
      <div class="node">
        <div class="node-header">Header</div>
        <div class="node-content">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </div>
      </div>
    </ng-diagram-node-resize-adornment>
  `,
  hostDirectives: [
    { directive: NgDiagramNodeSelectedDirective, inputs: ['node'] },
  ],
  styleUrls: ['./node.component.scss'],
})
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
