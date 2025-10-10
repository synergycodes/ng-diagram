import { Component, input } from '@angular/core';
import {
  NgDiagramNodeSelectedDirective,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';

// @section-start
@Component({
  template: `
    <div class="custom-node">
      <div class="custom-node__header">Node title</div>
      <div class="custom-node__content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </div>
    </div>
  `,
  // @mark-start
  hostDirectives: [
    { directive: NgDiagramNodeSelectedDirective, inputs: ['node'] },
  ],
  // @mark-end
  styleUrls: ['./node.component.scss'],
})
export class DefaultNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
// @section-end
