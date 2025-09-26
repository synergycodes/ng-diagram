import { Component, input } from '@angular/core';
import {
  NgDiagramNodeRotateAdornmentComponent, // @mark NgDiagramNodeRotateAdornmentComponent
  NgDiagramNodeSelectedDirective,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';

@Component({
  selector: 'node',
  imports: [NgDiagramNodeRotateAdornmentComponent], // @mark [NgDiagramNodeRotateAdornmentComponent]
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
})
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
// @collapse-end
