import { Component, input } from '@angular/core';
import {
  NgDiagramNodeRotateAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';

// @section-start
@Component({
  // @mark-start
  imports: [NgDiagramNodeRotateAdornmentComponent],
  // @mark-end
  template: `
    <!-- @mark-start -->
    <ng-diagram-node-rotate-adornment />
    <!-- @mark-end -->
    <div class="node">
      <div class="node-header">Header</div>
      <div class="node-content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </div>
    </div>
  `,
  // @collapse-start
  hostDirectives: [
    { directive: NgDiagramNodeSelectedDirective, inputs: ['node'] },
  ],
  styleUrl: './node.component.scss',
  // @collapse-end
})
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
// @section-end
