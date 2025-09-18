import { Component, input } from '@angular/core';
import { type NgDiagramNodeTemplate, type Node } from 'ng-diagram';

@Component({
  selector: 'node',
  imports: [],
  template: `
    <div class="node">
      <div class="node-header">Header</div>
      <div class="node-content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </div>
    </div>
  `,
  styleUrl: './node.component.scss',
})
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
