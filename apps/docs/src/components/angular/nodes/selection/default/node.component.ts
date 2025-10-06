import { Component, input } from '@angular/core';
import {
  NgDiagramNodeSelectedDirective,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';

// @section-start
@Component({
  selector: 'node',
  template: `
    <div class="node">
      <div class="node-header">Header {{ node().data.label }}</div>
      <div class="node-content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
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
