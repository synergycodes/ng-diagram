import { Component, input } from '@angular/core';
import {
  NgDiagramNodeResizeAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';

// @section-start
@Component({
  // @mark-substring:NgDiagramNodeResizeAdornmentComponent
  imports: [NgDiagramNodeResizeAdornmentComponent],
  template: `
    <!-- @mark-start -->
    <ng-diagram-node-resize-adornment>
      <div class="custom-node">
        <div class="custom-node__header">Node title</div>
        <div class="custom-node__content">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
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
