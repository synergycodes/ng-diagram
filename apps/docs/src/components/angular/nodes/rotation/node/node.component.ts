// @section-start
import { Component, input } from '@angular/core';
import {
  NgDiagramNodeRotateAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';

@Component({
  // @mark-start
  imports: [NgDiagramNodeRotateAdornmentComponent],
  // @mark-end
  template: `
    <!-- @mark-start -->
    <ng-diagram-node-rotate-adornment />
    <!-- @mark-end -->
    <div class="custom-node">
      <div class="custom-node__header">Node title</div>
      <div class="custom-node__content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
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
