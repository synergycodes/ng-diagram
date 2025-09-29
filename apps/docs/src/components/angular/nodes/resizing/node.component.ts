import { Component, input } from '@angular/core';
import {
  NgDiagramNodeResizeAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';

// @section-start
@Component({
  selector: 'node',
  // @mark-substring:NgDiagramNodeResizeAdornmentComponent
  imports: [NgDiagramNodeResizeAdornmentComponent],
  template: `
    <!-- @mark-start -->
    <ng-diagram-node-resize-adornment>
      <div class="node">
        <div class="node-header">Header</div>
        <div class="node-content">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </div>
      </div>
    </ng-diagram-node-resize-adornment>
    <!-- @mark-end -->
  `,
  // @collapse-start
  hostDirectives: [
    { directive: NgDiagramNodeSelectedDirective, inputs: ['node'] },
  ],
  styleUrls: ['./node.component.scss'],
  // @collapse-end
})
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
// @section-end
