import { Component, input } from '@angular/core';
import {
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'node',
  imports: [NgDiagramPortComponent],
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
  },
  template: `
    <div class="node">
      <div class="node-header">Header</div>
      <div class="node-content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </div>
    </div>
    <ng-diagram-port id="port-left" type="both" side="left" />
    <ng-diagram-port id="port-top" type="both" side="top" />
    <ng-diagram-port id="port-right" type="both" side="right" />
    <ng-diagram-port id="port-bottom" type="both" side="bottom" />
  `,
  styles: [
    `
      :host {
        width: 100%;
        height: 100%;
        display: flex;
        .node {
          width: 200px;
          height: 100px;
          border: 1px solid #ccc;
          padding: 10px;
        }
        .node-header {
          font-size: 20px;
          background-color: #f5f5f5;
        }
        .node-content {
          font-size: 14px;
        }
      }
    `,
  ],
})
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
