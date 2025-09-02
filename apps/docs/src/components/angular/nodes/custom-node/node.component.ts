import { Component, input } from '@angular/core';
import {
  type NgDiagramNodeTemplate,
  type Node,
} from '@angularflow/angular-adapter';

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
  styles: [
    `
      :host {
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.7);

        .node {
          width: 200px;
          height: 100px;
          border: 1px solid #ccc;
          padding: 10px;

          .node-header {
            font-size: 20px;
            background-color: #f5f5f5;
          }

          .node-content {
            font-size: 14px;
          }
        }
      }
    `,
  ],
})
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
