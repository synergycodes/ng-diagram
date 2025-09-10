import { Component, input } from '@angular/core';
import {
  NgDiagramNodeSelectedDirective,
  type NgDiagramNodeTemplate,
  type Node,
} from '@angularflow/angular-adapter';

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
  hostDirectives: [
    { directive: NgDiagramNodeSelectedDirective, inputs: ['node'] },
  ],
  styleUrls: ['./node.component.scss'],
})
export class DefaultNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
